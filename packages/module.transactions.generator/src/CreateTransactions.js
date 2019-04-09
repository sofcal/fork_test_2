'use strict';

const Promise = require('bluebird');

const { RequestLogger } = require('@sage/bc-requestlogger');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');
const { CloudWatchSubscription } = require('@sage/bc-infrastructure-cloudwatch-subscription');
const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const ErrorSpecs = require('./ErrorSpecs');
const DB = require('@sage/bc-services-db');
const { Handler } = require('@sage/bc-independent-lambda-handler');
const keys = require('./params');
const BuildTransactions = require('./BuildTransactions');
const DBQueries = require('./dbQueries');

const serviceImpls = { DB };
const dbName = 'bank_db';


class CreateTransactions extends Handler {
    constructor({ config }) {
        super({ config });
        this.dbName = dbName;
    }

    static Create(...args) {
        return new CreateTransactions(...args);
    }

    run(event, context, callback) {
        const func = 'handler.run';

        return Promise.resolve(undefined)
            .then(() => {
                // eslint-disable-next-line no-param-reassign
                event.logger = RequestLogger.Create({ service: this.serviceId });
                event.logger.info({ function: func, log: 'started' });

                this.validate(event, { logger: event.logger });
                return Promise.resolve(undefined)
                    .then(() => {
                        const { SumoLogicLambdaARN } = this.config;
                        if (!SumoLogicLambdaARN) {
                            return undefined;
                        }

                        event.logger.info({ function: func, log: 'initialising CloudWatch Subscription' });
                        // initialise the CloudWatchSubscription which pushes logs to the sumo logic lambda
                        return CloudWatchSubscription.Register(event.logger, SumoLogicLambdaARN, context.logGroupName);
                    })
                    .then(() => {
                        if (this.initialised) {
                            event.logger.info({ function: func, log: 'skipping services and add-ons' });
                            return undefined;
                        }

                        // give the derived instance an opportunity to initialise any services or add-ons that are required for the
                        // running of the function. Since this class should be instantiated once, it gives the ability to cache items
                        event.logger.info({ function: func, log: 'initialising services and add-ons' });
                        return this.init(event, { logger: event.logger })
                            .then((initialised = false) => {
                                this.initialised = initialised;
                            });
                    })
                    .then(() => {
                        // now that everything else is set-up and ready to go, call the implementation for handling this request.
                        // This will be the business logic for the invocation of the lambda.
                        event.logger.info({ function: func, log: 'invoking handler function' });
                        return this.impl(event, { logger: event.logger });
                    })
                    .then((ret) => {
                        // if we get a valid response, give the derived class the opportunity to modify the response before we send it
                        return this.buildResponse(ret, { logger: event.logger })
                            .then((response) => {
                                event.logger.info({ function: func, log: 'sending success response' });
                                event.logger.info({ function: func, log: 'ended' });

                                // first parameter of the callback is the error response, so should be null for valid responses
                                callback(...response);
                            });
                    });
            })
            .catch((err) => {
                // if we caught an error; we ensure it's either a valid error we can return, or a 500 internal.
                event.logger.error({
                    function: func,
                    log: 'an error occurred while processing the request',
                    error: err.message || err
                });

                return this.buildErrorResponse(err, { logger: event.logger })
                    .then((response) => {
                        event.logger.info({ function: func, log: 'sending failure response' });
                        // for the most part, we still invoke the callback without an error; however, if we want the lambda to
                        // automatically retry, passing an error as the first parameter will achieve this
                        callback(...response);
                    });
            })
            .finally(() => {
                // last but not least, give the option to the derived class to cleanup resources it created. E.G database
                // connections. Since lambdas can be frozen, we want to allow the derived class the option to cleanup or
                // persist.
                return this.dispose({ logger: event.logger });
            });
    }

    validate(event, logger) {
        return super.validate(event, logger);
    }

    init(event, { logger }) { // eslint-disable-line class-methods-use-this
        const func = 'Handler.init';
        const self = this;
        logger.info({function: func, log: 'started'});
        const {Environment: env = 'test', AWS_REGION: region = 'local'} = process.env;

        return Promise.resolve(undefined)
            .then(() => getParams({env, region}, event.logger))
            .then((params) => {
                populateServices(self.services, {env, region, params}, event.logger);
                return connectDB(self.services, event.logger)
                    .then(() => params);
            })
            .catch((err) => {
                console.log(err);
            });
    }

    impl(event, { logger }) { // eslint-disable-line class-methods-use-this
        const self = this;
        const func = 'Handler.impl';
        logger.info({function: func, log: 'started'});
        // get details from event
        const bankAccountId = event.bankAccountId;
        const startTrxNo = event.startTrxNo;
        const numTrxToCreate = event.NumTrxToCreate;
        if (!bankAccountId) {
            throw new Error('bankAccountId not defined on request event');
        }
        if (!startTrxNo && startTrxNo !== 0) {
            throw new Error('startTrxNo not defined on request event');
        }
        if (!numTrxToCreate) {
            throw new Error('numTrxToCreate not defined on request event');
        }
        const dbQueries = new DBQueries(self.services.db);

        // find bank -- WHAT ABOUT LOCKING????
        return dbQueries.getBankAccount(bankAccountId)
            .then((bankAccount) => {
                const buildTransactions = new BuildTransactions();
                const buckets = buildTransactions.buildBuckets(bankAccountId, startTrxNo, numTrxToCreate);
                return dbQueries.updateTransactions(buckets)
                    .then(() => {
                        /* eslint-disable no-param-reassign */
                        bankAccount.bankAuthorisationToken = 'AUTO';
                        bankAccount.clientAuthorisationToken = 'AUTO';
                        bankAccount.lastTransactionId += numTrxToCreate;
                        if (numTrxToCreate > 0) {
                            bankAccount.setStatus('active');
                        } else {
                            bankAccount.setStatus('pending');
                        }
                        if (authAlwaysRequired(bankAccount.accountKey)) {
                            bankAccount.authAlwaysRequired = true;
                            bankAccount.status = 'authRequired';
                        }
                        return dbQueries.updateBankAccount(bankAccount);
                    });
            });
    }

    dispose({ logger }) { // eslint-disable-line class-methods-use-this
        const self = this;
        return disconnectDB(self, logger);
    }
}

const authAlwaysRequired = (accountKey) => (accountKey === 'MFA');

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
        .then((db) => {
            logger.info({ function: func, log: 'ended' });
            return db;
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




module.exports = CreateTransactions;
