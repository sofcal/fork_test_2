'use strict';

const validate = require('./validators');
const ErrorSpecs = require('./ErrorSpecs');
const keys = require('./params');
const { DBQueries } = require('./db');

const { StatusCodeError } = require('@sage/bc-statuscodeerror');
const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const DB = require('@sage/bc-services-db');
const { Handler } = require('@sage/bc-independent-lambda-handler');
const KeyValuePairCache = require('@sage/bc-services-keyvaluepaircache');

const Promise = require('bluebird');

const serviceImpls = { DB };
const dbName = 'bank_db';

class GenericAuthPostBankAccountLambda extends Handler{
    constructor({ config }) {
        console.log('AG TEST: Constructor Hit');
        super({ config });
        this.dbName = dbName;
    }

    static Create(...args) {
        console.log('AG TEST - Create Hit');
        return new GenericAuthPostBankAccountLambda(...args);
    }

    validate(event, { logger }) {
        console.log('AG TEST - Validate Hit');
        validate.event(event, { logger });
        validate.config(this.config, { logger });
        return super.validate(event, logger);
    }

    init(event, {logger}) {
        console.log('AG TEST - Init Hit');
        const func = `${GenericAuthPostBankAccountLambda.name}.init`;
        logger.info({function: func, log: 'started'});
        const {Environment: env = 'test', AWS_REGION: region = 'local'} = process.env;

        console.log(`AG TEST - env:${env} - region:${region}`);

        return Promise.resolve(undefined)
            .then(() => getParams({env, region}, event.logger))
            .then((params) => {
                console.log('AG TEST: getParams - ', params);
                populateServices(this.services, {env, region, params}, event.logger);
                return connectDB(this.services, event.logger)
                    .then(() => false);
            });
    }

    impl(event, { logger }) {
        console.log('AG TEST - Impl Hit');
        const func = `${GenericAuthPostBankAccountLambda.name}.impl`;

        // get details from event
        let requestId = event.body.bankAccount.accountKey;
        let bankId = event.body.bankAccount.accountIdentifier;
        logger.info({function: func, log: 'started', params: { requestId }});

        // can be multiple in cache
        // match on accountIdentifier

        console.log('AG TEST - Event requestId:', requestId);

        // TEST SOMETHING
        const {Environment: env = 'test', AWS_REGION: region = 'local'} = process.env;
        console.log(`AG TEST impl - env:${env} - region:${region}`);

        // Skeleton Implementation for Cache
        const key = requestId += 'postRedirectAction';
        const keyValuePairService = new KeyValuePairCache({env, region}); // TODO: update params
        return keyValuePairService.connect()
            .then(() => {
                return keyValuePairService.retrievePair(key)
                    .then((kvp) => {
                        // let bankAccount = kvp; TODO: do relative extraction - need to iterate through collection
                        let bankAccount = {
                            _id: bankId,
                            accountKey: 'b4a8b863-80d9-432f-9c8b-4095ba441581',
                            accountName: 'Test Bank 5',
                            bankIdentifier: '456'
                        }; //TODO: This is a test account; update record based on cache entry

                        keyValuePairService.disconnect();
                        const dbQueries = DBQueries.Create(this.services.db.getConnection());

                        return dbQueries.updateBankAccount({bankAccount}, {logger})
                            .then((something) => {
                                console.log('AG TEST - Update Bank: ', something);
                                event.logger.info({function: func, log: 'ended'});
                                return {statusCode: 200, body: 'Success'};
                            });
                    });
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

module.exports = GenericAuthPostBankAccountLambda;
