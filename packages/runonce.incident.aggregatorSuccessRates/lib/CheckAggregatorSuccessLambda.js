'use strict';

const { tasks } = require('./resources');
const flows = require('./flows');

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
        const { startDate, countryCodes, emailBlacklist, aggregatorWhitelist, taskWhitelist } = event.parsed;
        logger.info({function: func, log: 'started', params: { startDate, countryCodes, aggregatorWhitelist, taskWhitelist }});

        const dbQueries = DBQueries.Create(this.services.db.getConnection());
        const blob = new BlobStorage({ s3: this.services.s3, region: this.config.region, bucketName: this.config.bucket });

        const data = {};
        _.each(taskWhitelist, (task) => data[task] = {});

        return Promise.each(countryCodes,
            (countryCode) => {
                return Promise.each(taskWhitelist,
                    (task) => {
                        if (!_.contains(taskWhitelist, task)) {
                            logger.info({function: func, log: 'SKIPPING task RETRIEVE', params: { task, countryCode }});
                            return undefined;
                        }

                        logger.info({function: func, log: 'STARTED task RETRIEVE', params: { task, countryCode }});
                        return flows[task].retrieve({ data, task, countryCode, dbQueries, blob, event }, { logger })
                            .then(() => logger.info({function: func, log: 'ENDED task RETRIEVE', params: { task, countryCode }}));
                    });
            })
            .then(() => {
                const keys = {};

                return Promise.each(taskWhitelist,
                    (task) => {
                        if (!_.contains(taskWhitelist, task)) {
                            logger.info({ function: func, log: 'SKIPPING task STORE', params: { task }});
                            return undefined;
                        }

                        const store = flows[task].store || defaultStore;

                        logger.info({function: func, log: 'STARTED task STORE', params: { task }});
                        return store({ data, task, dbQueries, blob, event }, { logger })
                            .then((result) => {
                                keys[task] = result;
                                logger.info({function: func, log: 'ENDED task STORE', params: { task }});
                            });
                    })
                    .then(() => keys);
            })
    }

    dispose({ logger }) { // eslint-disable-line class-methods-use-this
        return disconnectDB(this.services, logger);
    }
}

const defaultStore = Promise.method(({ data, task, dbQueries, blob, event }, { logger }) => {
    return blob.storeResults({ keyPostfix: `${task}.json`, results: data[task] }, { logger })
        .then(({ key }) => {
            return [key];
        });
});

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
    DB: 'bank_db'
};

module.exports = CheckAggregatorSuccessLambda;
