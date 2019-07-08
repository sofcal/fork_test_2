'use strict';

const validate = require('./validators');
const ErrorSpecs = require('./ErrorSpecs');
const keys = require('./params');
const TransactionBuilder = require('./TransactionBuilder');
const { DBQueries } = require('./db');

const { StatusCodeError } = require('@sage/bc-statuscodeerror');
const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const DB = require('@sage/bc-services-db');
const { Handler } = require('@sage/bc-independent-lambda-handler');

const Big = require('bignumber.js');
const Promise = require('bluebird');
const _ = require('underscore');

const serviceImpls = { DB };
const dbName = 'bank_db';

class CreateTransactionsLambda extends Handler {
    constructor({ config }) {
        super({ config });
        this.dbName = dbName;
    }

    static Create(...args) {
        return new CreateTransactionsLambda(...args);
    }

    validate(event, { logger }) {
        /* eslint-disable-next-line no-param-reassign */
        event.parsed = validate.event(event, { logger });
        validate.config(this.config, { logger });
        return super.validate(event, logger);
    }

    init(event, { logger }) {
        const func = `${CreateTransactionsLambda.name}.init`;
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
        const func = `${CreateTransactionsLambda.name}.impl`;
        // get details from event
        const { bankAccountId, numTrxToCreate, triggerAuth, randomSignage } = event.parsed;
        logger.info({function: func, log: 'started', params: { bankAccountId }});

        const dbQueries = DBQueries.Create(this.services.db.getConnection());

        return dbQueries.getBankAccountsById({ bankAccountId, all: true }, { logger })
            .then((bankAccounts) => {
                logger.info({function: func, log: 'retrieved bankAccounts from db', params: { count: bankAccounts.length }});
                if (!bankAccounts || bankAccounts.length !== 1) {
                    logger.info({function: func, log: 'bankAccount not found' });
                    throw StatusCodeError.CreateFromSpecs([ErrorSpecs.notFound.bankAccount], ErrorSpecs.notFound.bankAccount.statusCode);
                }

                const [bankAccount] = bankAccounts;
                logger.info({function: func, log: 'retrieved bankAccounts from db', params: { lastTransactionId: bankAccount.lastTransactionId }});

                const transactionBuilder = new TransactionBuilder();
                const transactions = transactionBuilder.buildTransactions({ bankAccount, numTrxToCreate, randomSignage });

                logger.info({function: func, log: 'created transactions', params: { first: _.first(transactions).incrementedId, last: _.last(transactions).incrementedId }});

                const trxTotal = _.reduce(transactions, (memo, t) => memo.add(t.transactionAmount), new Big(0)).round(2).toNumber();
                const balance = new Big(bankAccount.availableBalanceAmount).add(trxTotal).round(2).toNumber();

                logger.info({function: func, log: 'calculated balances', params: { trxTotal, previousBalance: bankAccount.availableBalanceAmount, newBalance: balance } });

                return dbQueries.updateTransactions({ bankAccount, transactions }, { logger })
                    .then(() => {
                        logger.info({function: func, log: 'added transactions to database' });

                        bankAccount.availableBalanceAmount = balance;       // eslint-disable-line no-param-reassign
                        bankAccount.openingBalanceAmount = balance;         // eslint-disable-line no-param-reassign
                        bankAccount.ledgerBalanceAmount = balance;          // eslint-disable-line no-param-reassign

                        const now = new Date();
                        bankAccount.lastTransactionsReceived = now;
                        bankAccount.ledgerBalanceDate = now;                // eslint-disable-line no-param-reassign
                        bankAccount.availableBalanceDate = now;             // eslint-disable-line no-param-reassign

                        bankAccount.bankAuthorisationToken = 'AUTO';        // eslint-disable-line no-param-reassign
                        bankAccount.clientAuthorisationToken = 'AUTO';      // eslint-disable-line no-param-reassign
                        bankAccount.lastTransactionId += numTrxToCreate;    // eslint-disable-line no-param-reassign
                        if (numTrxToCreate > 0) {
                            bankAccount.status = 'active';                  // eslint-disable-line no-param-reassign
                        } else {
                            bankAccount.status = 'pending';                 // eslint-disable-line no-param-reassign
                        }

                        if (authAlwaysRequired(bankAccount.accountKey)) {
                            bankAccount.authAlwaysRequired = true;          // eslint-disable-line no-param-reassign
                            bankAccount.status = 'authRequired';            // eslint-disable-line no-param-reassign
                        }

                        if (triggerAuth) {
                            bankAccount.status = 'authRequired';            // eslint-disable-line no-param-reassign
                        }

                        return dbQueries.updateBankAccount({ bankAccount }, { logger })
                            .then(() => {
                                logger.info({function: func, log: 'ended'});
                            })
                    });
            });
    }

    dispose({ logger }) { // eslint-disable-line class-methods-use-this
        return disconnectDB(this.services, logger);
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

module.exports = CreateTransactionsLambda;
