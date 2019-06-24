'use strict';

const validate = require('./validators');
const ErrorSpecs = require('./ErrorSpecs');
const keys = require('./params');
const { DBQueries } = require('./db');

const { StatusCodeError } = require('@sage/bc-statuscodeerror');
const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const DB = require('@sage/bc-services-db');
const S3 = require('@sage/bc-services-s3');
const { Handler } = require('@sage/bc-independent-lambda-handler');

const Promise = require('bluebird');
const _ = require('underscore');

const serviceImpls = { DB, S3 };
const dbName = 'bank_db';

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
        const {Environment: env = 'test', AWS_REGION: region = 'local'} = process.env;

        return Promise.resolve(undefined)
            .then(() => getParams({env, region}, event.logger))
            .then((params) => {
                populateServices(this.services, {env, region, params}, event.logger);
                return connectDB(this.services, event.logger)
                    .then(() => false);
            });
    }

    impl(event, { logger }) {
        const func = `${MissingBankAccountsLambda.name}.impl`;
        // get details from event
        const { bucket, key, destination } = event.parsed;
        logger.info({function: func, log: 'started', params: { bucket, key, destination }});

        const dbQueries = DBQueries.Create(this.services.db.getConnection());
        const s3 = new serviceImpls.S3({key, bucket});
        let extractedBankFileData;

        return s3.get(key, bucket)
            .then(bankFile => {
                const regExHSBC = /(?<=^03,)([0-9]{14})/gm;
                const bankFileString = bankFile.Body.toString();
                const accountIdentifiers = bankFileString.match(regExHSBC);

                if (!accountIdentifiers || accountIdentifiers.length === 0) {
                    logger.info({function: func, log: 'No accounts found in file' });
                    throw StatusCodeError.CreateFromSpecs([ErrorSpecs.notFound.accountIdentifiers], ErrorSpecs.notFound.accountIdentifiers.statusCode);
                }

                const accountDetailsFromBankFile = accountIdentifiers.map(value => {
                    return {    
                        "accountIdentifier": value.slice(6),
                        "bankIdentifier": value.slice(0,6)
                    }
                });

                this.extractedBankFileData = accountDetailsFromBankFile;
                return dbQueries.getBankAccountsByAccountDetails(accountDetailsFromBankFile);
            })
            .then(dbQueryResults => {
                const filteredResult = this.extractedBankFileData.filter(bankFileAccount => !dbQueryResults.some(dbAccount => _.isEqual(bankFileAccount, dbAccount)));
                let missingAccounts = 'Bank Identifier, Account Identifier';

                filteredResult.forEach(element => {
                    missingAccounts += `\n${element.bankIdentifier}, ${element.accountIdentifier}`;
                });

                return s3.put(`missing-accounts-from-${key}.txt`, missingAccounts, 'AES256', destination) 
            })
            .then(() => {
                logger.info({ function: func, log: 'ended' });
            })
            .catch((err) => {
                console.log(err);
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
    services.db = serviceImpls.DB.Create({ env, region, domain, username, password, replicaSet, db: 'bank_db' });

    // add any additional services that are created by the serviceLoader for the lambda

    // Object.assign(services, serviceLoader.load({ env, region, params }));

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

module.exports = MissingBankAccountsLambda;
