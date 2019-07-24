'use strict';

const Promise = require('bluebird');
const AWS = require('aws-sdk');

const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const { RequestLogger } = require('@sage/bc-requestlogger');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');
const ErrorSpecs = require('./ErrorSpecs');

const DB = require('@sage/bc-services-db');

const serviceImpls = { DB };

AWS.config.setPromisesDependency(Promise);

class Handler {
    constructor({ dbName, serviceLoader, keys }) {
        if (new.target === Handler) {
            throw new Error('Handler should not be instantiated; extend Handler instead.');
        }
        if (!dbName || typeof dbName !== 'string') {
            throw new Error('dbName must be a string');
        }
        if (!keys || !Array.isArray(keys)) {
            throw new Error('keys must be an array');
        }

        this.dbName = dbName;
        this.services = {};
        this.serviceLoader = serviceLoader;
        this.keys = keys;
        this.logger = RequestLogger.Create({ service: '@sage/bc-default-lambda-handler' });
    }

    run(event, context, callback) {
        const func = 'handler.run';
        const self = this;
        const { Environment: env = 'test', AWS_REGION: region = 'local' } = process.env;
        const services = self.services || {};
        return Promise.resolve(undefined)
            .then(() => {
                // eslint-disable-next-line no-param-reassign
                // event.logger = RequestLogger.Create({ service: '@sage/bc-default-lambda-handler' });
                if (!env || !region) {
                    const log = `invalid parameters - env: ${env}; region: ${region};`;
                    self.logger.error({ function: func, log });
                    throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent], ErrorSpecs.invalidEvent.statusCode);
                }

                return getParams({ env, region }, self, self.logger)
                    .then((params) => {
                        return self.populateServices(self.services, { env, region, params }, self.logger)
                            .then(() => connectDB(self.services, params, self.logger, self.dbName))
                            .then(() => params);
                    });
            })
            .then(() => {
                return setupLogGroupSubscription(event, context);
            })
            .then((params) => this.impl(event, params, services))
            .then((ret) => {
                const response = {
                    statusCode: 200,
                    body: JSON.stringify(ret)
                };
                self.logger.info({ function: func, log: 'sending success response: 200' });
                callback(null, response);
            })
            .catch((err) => {
                self.logger.error({ function: func, log: 'an error occurred while processing the request', error: err.message || err });
                const statusCodeError = StatusCodeError.is(err)
                    ? err
                    : StatusCodeError.CreateFromSpecs([ErrorSpecs.internalServer], ErrorSpecs.internalServer.statusCode);

                const response = statusCodeError.toDiagnoses();
                const status = statusCodeError.statusCode;

                self.logger.info({ function: func, log: `sending failure response: ${status}`, response });
                callback(err.failLambda ? err : null, { statusCode: status, body: JSON.stringify(response) });
            })
            .finally(() => {
                return disconnectDB(services, self.logger);
            });
    }

    impl() { // eslint-disable-line class-methods-use-this
        throw new Error('impl function should be extended');
    }

    loadAdditionalServices() { // eslint-disable-line class-methods-use-this
        throw new Error('loadAdditionalServices function should be extended');
    }

    populateServices(...args) {
        return populateServicesImpl(this, ...args);
    }
}

const populateServicesImpl = Promise.method((self, services, { env, region, params }) => {
    const func = 'handler.populateServices';
    self.logger.info({ function: func, log: 'started' });

    const {
        'defaultMongo.username': username,
        'defaultMongo.password': password,
        'defaultMongo.replicaSet': replicaSet,
        domain
    } = params;

    // eslint-disable-next-line no-param-reassign
    services.db = serviceImpls.DB.Create({ env, region, domain, username, password, replicaSet, db: self.dbName = 'bank_db' });

    // add any additional services that are created by the serviceLoader for the lambda
    self.loadAdditionalServices({ env, region });
    self.logger.info({ function: func, log: 'ended' });

    return services;
});

const getParams = ({ env, region }, self, logger) => {
    const { keys } = self; // eslint-disable-line no-shadow
    const func = 'handler.getParams';
    logger.info({ function: func, log: 'started' });

    const paramPrefix = `/${env}/`;
    const params = {};
    logger.info({ function: func, log: 'retrieving keys', keys, paramPrefix });

    const loader = ParameterStoreStaticLoader.Create({ keys, paramPrefix, env: { region } });
    return loader.load(params)
        .then(() => {
            const retrievedCount = Object.keys(params).length;

            logger.info({ function: func, log: 'finished retrieving param-store keys', requested: keys.length, retrieved: retrievedCount });

            if (!retrievedCount || retrievedCount < keys.length) {
                throw StatusCodeError.CreateFromSpecs([ErrorSpecs.failedToRetrieveParameters], ErrorSpecs.failedToRetrieveParameters.statusCode);
            }

            logger.info({ function: func, log: 'ended' });
            return params;
        });
};

const connectDB = (services, params, logger, dbName) => {
    const func = 'handler.connectDB';
    logger.info({ function: func, log: 'started' });

    return services.db.connect(dbName)
        .then((db) => {
            logger.info({ function: func, log: 'ended' });
            return db;
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

const setupLogGroupSubscription = Promise.method((event, context) => {
    const func = 'handler.setupLogGroupSubscription';
    const cloudwatchlogs = new AWS.CloudWatchLogs();
    return cloudwatchlogs.describeSubscriptionFilters({ logGroupName: context.logGroupName }).promise()
        .then((subFilterDetails) => {
            if (subFilterDetails.subscriptionFilters.length === 0) {
                event.logger.info({ function: func, log: 'assigning subscription filter' });
                const params = {
                    destinationArn: process.env.SumoLogicLambdaARN,
                    filterName: 'sumoLogic',
                    filterPattern: ' ',
                    logGroupName: context.logGroupName
                };
                return cloudwatchlogs.putSubscriptionFilter(params).promise();
            }
            event.logger.info({ function: func, log: 'subscription filter already assigned' });
            return null;
        })
        .catch((err) => {
            event.logger.error({ function: func, log: 'failed to configure logging subscription filter.', err: err.message });
        });
});

module.exports = Handler;
