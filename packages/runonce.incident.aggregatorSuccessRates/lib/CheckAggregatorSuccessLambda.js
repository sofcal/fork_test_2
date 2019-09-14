'use strict';

const validate = require('./validators');
const ErrorSpecs = require('./ErrorSpecs');
const keys = require('./params');
const { DBQueries } = require('./db');
const { BlobStorage } = require('./blob');

const { StatusCodeError } = require('@sage/bc-statuscodeerror');
const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const DB = require('@sage/bc-services-db');
const S3 = require('@sage/bc-services-s3');
const { Handler } = require('@sage/bc-independent-lambda-handler');

const Big = require('bignumber.js');
const Promise = require('bluebird');
const _ = require('underscore');

const serviceImpls = { DB };

class CheckAggregatorSuccessLambda extends Handler {
    constructor({ config }) {
        super({ config });
    }

    static Create(...args) {
        return new CheckAggregatorSuccessLambda(...args);
    }

    validate(event, { logger }) {
        /* eslint-disable-next-line no-param-reassign */
        event.parsed = validate.event(event, { logger });
        validate.config(this.config, { logger });
        return super.validate(event, logger);
    }

    init(event, { logger }) {
        const func = `${CheckAggregatorSuccessLambda.name}.init`;
        logger.info({function: func, log: 'started'});
        const {Environment: env = 'test', AWS_REGION: region = 'local'} = this.config;

        return Promise.resolve(undefined)
            .then(() => getParams({env, region}, event.logger))
            .then((params) => {
                populateServices(this.services, { env, region, params }, event.logger);
                return connectDB(this.services, event.logger)
                    .then(() => false);
            });
    }

    impl(event, { logger }) {
        const func = `${CheckAggregatorSuccessLambda.name}.impl`;
        // get details from event
        const { switchOverDate: startDate, countryCodes, emailBlacklist, aggregatorWhitelist } = event.parsed;
        logger.info({function: func, log: 'started', params: { }});

        const dbQueries = DBQueries.Create(this.services.db.getConnection());
        const blob = new BlobStorage({ s3: this.services.s3, region: this.config.region, bucketName: this.config.bucket });

        const all = {
            manualUploadCounts: {},
            transactionSyncResults: {}
        };

        return Promise.each(countryCodes,
            (cc) => {
                return Promise.resolve(undefined)
                    .then(() => {
                        logger.info({function: func, log: 'manual upload CHECK for countryCode: STARTED', params: { countryCode: cc, aggregatorWhitelist }});
                        return dbQueries.getManualUploadedCounts({ region: cc, startDate, emailBlacklist, aggregatorWhitelist, all: true }, { logger: event.logger })
                            .then((resultsPerAggregator = []) => {
                                all.manualUploadCounts[cc] = {};
                                _.each(aggregatorWhitelist, (aggregator) => {
                                    logger.info({function: func, log: 'manual upload PARSING for countryCode', params: { countryCode: cc, aggregator }});
                                    const { bankAccounts = [] } = _.find(resultsPerAggregator, (a) => a._id === aggregator) || {};
                                    all.manualUploadCounts[cc][aggregator] = {
                                        totalBankAccounts: bankAccounts.length,
                                        totalOrganisations: _.uniq(bankAccounts, false, (ba) => ba.organisationId).length,
                                        results: bankAccounts
                                    };
                                });

                                logger.info({function: func, log: 'manual upload CHECK for countryCode: ENDED', params: { countryCode: cc }});
                            })
                    })
                    .then(() => {
                        logger.info({function: func, log: 'transaction sync CHECK for countryCode: STARTED', params: { countryCode: cc, aggregatorWhitelist }});
                        return dbQueries.getTransactionSyncResults({ region: cc, startDate, emailBlacklist, aggregatorWhitelist, all: true }, { logger: event.logger })
                            .then((resultsPerAggregator = []) => {
                                all.transactionSyncResults[cc] = {};
                                _.each(aggregatorWhitelist, (aggregator) => {
                                    logger.info({function: func, log: 'transaction sync PARSING for countryCode', params: { countryCode: cc, aggregator }});
                                    all.transactionSyncResults[cc][aggregator] = _.find(resultsPerAggregator, (rpa) => rpa._id === aggregator) || {};
                                });

                                logger.info({function: func, log: 'transaction sync CHECK for countryCode: ENDED', params: { countryCode: cc }});
                            })
                    })
            })
            .then(() => {
                const keys = {};
                return Promise.resolve(undefined)
                    .then(() => {
                        const keyPostfix = 'manual_upload_counts';
                        logger.info({function: func, log: 'S3 upload STARTED', params: { keyPostfix }});
                        return blob.storeResults({ keyPostfix, results: all.manualUploadCounts }, { logger })
                            .then(({ key }) => {
                                keys.manual_upload_counts = key;
                                logger.info({function: func, log: 'S3 upload ENDED', params: { keyPostfix }});
                            });
                    })
                    .then(() => {
                        const keyPostfix = 'transaction_syncs';
                        logger.info({function: func, log: 'S3 upload STARTED', params: { keyPostfix }});
                        return blob.storeResults({ keyPostfix, results: all.transactionSyncResults }, { logger })
                            .then(({ key }) => {
                                keys.transaction_sync_results = key;
                                logger.info({function: func, log: 'S3 upload ENDED', params: { keyPostfix }});
                            });
                    })
                    .then(() => keys);
            });
    }

    dispose({ logger }) { // eslint-disable-line class-methods-use-this
        return disconnectDB(this.services, logger);
    }
}

const getParams = ({ env, region }, logger) => {
    const func = 'handler.getParams';
    logger.info({ function: func, log: 'started' });

    const paramPrefix = `/${env}/`;
    const params = {};

    logger.info({ function: func, log: 'retrieving keys', keys, paramPrefix });

    const loader = ParameterStoreStaticLoader.Create({ keys, paramPrefix, env: { region } });
    return loader.load(params)
        .then((updated) => {
            const retrievedCount = Object.keys(updated).length;

            logger.info({ function: func, log: 'finished retrieving param-store keys', requested: keys.length, retrieved: retrievedCount });

            if (!retrievedCount || retrievedCount < keys.length) {
                throw StatusCodeError.CreateFromSpecs([ErrorSpecs.failedToRetrieveParameters], ErrorSpecs.failedToRetrieveParameters.statusCode);
            }

            logger.info({ function: func, log: 'ended' });
            return updated;
        });
};

const populateServices = (services, { env, region, params }, logger) => {
    const func = 'handler.getServices';
    logger.info({ function: func, log: 'started' });

    const {
        'defaultMongo.username': username,
        'defaultMongo.password': password,
        'defaultMongo.replicaSet': replicaSet,
        domain
    } = params;

    // eslint-disable-next-line no-param-reassign
    services.db = serviceImpls.DB.Create({ env, region, domain, username, password, replicaSet, db: consts.DB });

    const { bucket: bucketName } = process.env;
    const bucket = BlobStorage.getBucketName({ bucketName });
    services.s3 = S3.Create({ bucket })

    logger.info({ function: func, log: 'ended' });
};

const connectDB = (services, logger) => {
    const func = 'handler.connectDB';
    logger.info({ function: func, log: 'started' });

    return services.db.connect()
        .then(() => {
            logger.info({ function: func, log: 'ended' });
        })
        .catch((err) => {
            console.log(err);
        });
};

const disconnectDB = Promise.method((services, logger) => {
    const func = 'handler.disconnectDB';
    logger.info({ function: func, log: 'started' });

    if (!services.db) {
        logger.info({ function: func, log: 'no db service' });
        return undefined;
    }

    return services.db.disconnect()
        .then(() => {
            logger.info({ function: func, log: 'ended' });
        });
});

const consts = {
    DB: 'bank_db',
    SWITCHOVER_DATE: new Date('2019-09-12T06:00:00.000Z'),
    COUNTRY_CODES: ['IRL', 'GBR', 'FRA', 'ESP'],
    FILTER_EMAILS: [

    ]
};

module.exports = CheckAggregatorSuccessLambda;
