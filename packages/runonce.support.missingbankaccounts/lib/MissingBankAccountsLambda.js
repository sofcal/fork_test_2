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
const fs = require('fs');

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
        const { bucket, key } = event.parsed;
        logger.info({function: func, log: 'started', params: { bucket, key }});

        const dbQueries = DBQueries.Create(this.services.db.getConnection());
        
        const s3 = new serviceImpls.S3({key, bucket});
        const rawBankFile = s3.get(key, bucket);

        return rawBankFile
            .then(bankFile => {
                const regExHSBC = /(?<=^03,)([0-9]{14})/gm;
                const bankFileString = bankFile.Body.toString();
                const accountIdentifiers = bankFileString.match(regExHSBC);

                const accountDetailsFromBankFile = accountIdentifiers.map(value => {
                    return {    
                        "accountIdentifier": value.slice(6),
                        "BankIdentifier": value.slice(0,6)
                    }
                })

                const accountDetailsTestObject = [{accountIdentifier: '34990232', bankIdentifier: '17521492'}, {accountIdentifier: '35312500', bankIdentifier: '17657712'}];
                console.log('accountDetailsTestObject: ', accountDetailsTestObject);
                return accountDetailsTestObject;
            })
            .then((accoundDetails) => {
                const testFind = dbQueries.getBankAccountsByAccountDetails(accoundDetails, { logger });

                logger.info({function: func, log: 'ended'});
                return testFind;
            })
            
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
