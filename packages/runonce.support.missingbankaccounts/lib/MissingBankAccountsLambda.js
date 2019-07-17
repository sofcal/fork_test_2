'use strict';

const validate = require('./validators');
const ErrorSpecs = require('./ErrorSpecs');
const keys = require('./params');
const { DBQueries } = require('./db');
const extractors = require('./extractors');

const { StatusCodeError } = require('@sage/bc-statuscodeerror');
const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const DB = require('@sage/bc-services-db');
const S3 = require('@sage/bc-services-s3');
const { Handler } = require('@sage/bc-independent-lambda-handler');

const Promise = require('bluebird');
const _ = require('underscore');

const serviceImpls = { DB, S3 };
const dbName = 'bank_db';
const missingAccountsHeader = 'Bank Identifier,Account Identifier';
const outputFilePrefix = 'missing-accounts-from-';

class MissingBankAccountsLambda extends Handler {
    constructor({ config }) {
        super({ config });
        this.dbName = dbName;
    }

    static Create(...args) {
        return new MissingBankAccountsLambda(...args);
    }

    validate(event, { logger }) {
        /* eslint-disable-next-line no-param-reassign */
        event.parsed = validate.event(event, { logger });
        validate.config(this.config, { logger });
        return super.validate(event, logger);
    }

    init(event, { logger }) {
        const func = `${MissingBankAccountsLambda.name}.init`;
        logger.info({function: func, log: 'started'});
        const { OutputBucket: outputBucket, Environment: env = 'test', AWS_REGION: region = 'local' } = this.config;
        return Promise.resolve(undefined)
            .then(() => getParams({env, region}, event.logger))
            .then((params) => {
                populateServices(this.services, {env, region, outputBucket, params}, event.logger);
                return connectDB(this.services, event.logger)
                    .then(() => false);
            });
    }

    impl(event, { logger }) {
        const func = `${MissingBankAccountsLambda.name}.impl`;
        // get details from event
        const { bucket, key, bank } = event.parsed;
        logger.info({function: func, log: 'started', params: { bucket, key, bank }});

        const dbQueries = DBQueries.Create(this.services.db.getConnection());
        
        return Promise.resolve(undefined)
            .then(() => {
                return this.services.s3.get(key, bucket)
                .catch((err) => {
                    logger.info({function: func, log: 'Error from S3', params: { error: err.message || err } });
                    throw StatusCodeError.CreateFromSpecs([ErrorSpecs.s3Error.read], ErrorSpecs.s3Error.read.statusCode);
                })
                .then((bankFile) => {
                    if (!bankFile.Body) {
                        logger.info({function: func, log: 'No Body in bank file' });
                        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidExtractorInput.body], ErrorSpecs.invalidExtractorInput.body.statusCode);
                    }
                    const bankFileString = bankFile.Body.toString();
                    const accountIdentifiers = extractors[bank](bankFileString);

                    return accountIdentifiers;
                })
            })
            .then((accountDetailsFromBankFile) => {
                return dbQueries.getBankAccountsByAccountDetails(accountDetailsFromBankFile)
                .catch((err) => {
                    logger.info({function: func, log: 'Error from S3', params: { error: err.message || err } });
                    throw StatusCodeError.CreateFromSpecs([ErrorSpecs.failedToReadDb], ErrorSpecs.failedToReadDb.statusCode);
                })
                .then((dbQueryResults) => {
                    // checking for matching account details, and filtering out the matching details from the bank file
                    const filteredResult = accountDetailsFromBankFile.filter((bankFileAccount) => !dbQueryResults.some((dbAccount) => _.isEqual(bankFileAccount, dbAccount)));

                    // creating the string from the array of filtered results into a csv format
                    return _.reduce(filteredResult, (memo, element) => (`${memo}\n${element.bankIdentifier},${element.accountIdentifier}`), missingAccountsHeader);
                })
            })
            .then((fileContents) => {
                return this.services.s3.put((`${outputFilePrefix}${key}.csv`), fileContents, 'AES256')
                .catch((err) => {
                    logger.info({function: func, log: 'Error from S3', params: { error: err.message || err } });
                    throw StatusCodeError.CreateFromSpecs([ErrorSpecs.s3Error.write], ErrorSpecs.s3Error.write.statusCode);
                })
            })
            .then(() => {
                logger.info({ function: func, log: 'ended' });
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

const populateServices = (services, { env, region, outputBucket, params }, logger) => {
    const func = 'handler.getServices';
    logger.info({ function: func, log: 'started' });

    const {
        'defaultMongo.username': username,
        'defaultMongo.password': password,
        'defaultMongo.replicaSet': replicaSet,
        domain
    } = params;

    // eslint-disable-next-line no-param-reassign
    services.db = serviceImpls.DB.Create({ env, region, domain, username, password, replicaSet, db: 'bank_db' });
    services.s3 = serviceImpls.S3.Create({ bucket: outputBucket });

    logger.info({ function: func, log: 'ended' });
};

const connectDB = (services, logger) => {
    const func = 'handler.connectDB';
    logger.info({ function: func, log: 'started' });

    return services.db.connect()
        .then(() => {
            logger.info({ function: func, log: 'ended' });
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

module.exports = MissingBankAccountsLambda;
