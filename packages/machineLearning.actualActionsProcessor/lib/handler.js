'use strict';

const Promise = require('bluebird');
const impl = require('./impl');
const ErrorSpecs = require('./ErrorSpecs');
const AWS = require('aws-sdk');

const { ParameterStoreStaticLoader } = require('internal-parameterstore-static-loader');
const { RequestLogger } = require('internal-request-logger');
const { StatusCodeError } = require('internal-status-code-error');

const DB = require('internal-services-db');

const serviceImpls = { DB };

const keys = require('./params');

const dbName = 'bank_db';

module.exports.run = (event, context, callback) => {
    const func = 'handler.run';

    // eslint-disable-next-line no-param-reassign
    event.logger = RequestLogger.Create({ service: 'machine-learning-actual-actions-processor' });
    event.logger.info({ function: func, log: 'started' });

    // these environment variables allow us to retrieve the correct param-store values for more configurable options
    const { Environment: env, AWS_REGION: region } = process.env;
    const services = {};

    return Promise.resolve(undefined)
        .then(() => {
            return setupLogGroupSubscription(event, context);
        })
        .then(() => {
            if (!env || !region) {
                const log = `invalid parameters - env: ${env}; region: ${region};`;
                event.logger.error({ function: func, log });
                throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent], ErrorSpecs.invalidEvent.statusCode);
            }

            return getParams({ env, region }, event.logger)
                .then((params) => {
                    return connectDB(services, { env, region }, params, event.logger)
                        .then(() => params);
                });
        })
        .then(() => {
            return setupLogGroupSubscription(event, context);
        })
        .then((params) => impl.run(event, params, services))
        .then((ret) => {
            const response = {
                statusCode: 200,
                body: JSON.stringify(ret)
            };

            event.logger.info({ function: func, log: 'sending success response: 200' });
            callback(null, response);
        })
        .catch((err) => {
            event.logger.error({ function: func, log: 'an error occurred while processing the request', error: err.message || err });

            const statusCodeError = StatusCodeError.is(err)
                ? err
                : StatusCodeError.CreateFromSpecs([ErrorSpecs.internalServer], ErrorSpecs.internalServer.statusCode);

            const response = statusCodeError.toDiagnoses();
            const status = statusCodeError.statusCode;

            event.logger.info({ function: func, log: `sending failure response: ${status}`, response });
            callback(err.failLambda ? err : null, { statusCode: status, body: JSON.stringify(response) });
        })
        .finally(() => {
            return disconnectDB(services, event.logger);
        });
};

const getParams = ({ env, region }, logger) => {
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

const connectDB = (services, { env, region }, params, logger) => {
    const func = 'handler.connectDB';
    logger.info({ function: func, log: 'started' });

    const {
        'defaultMongo.username': username,
        'defaultMongo.password': password,
        'defaultMongo.replicaSet': replicaSet,
        domain
    } = params;

    // eslint-disable-next-line no-param-reassign
    services.db = serviceImpls.DB.Create({ env, region, domain, username, password, replicaSet, db: dbName });

    return services.db.connect()
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
    const cloudwatchlogs = Promise.promisifyAll(new AWS.CloudWatchLogs());
    return cloudwatchlogs.describeSubscriptionFiltersAsync({ logGroupName: context.logGroupName })
        .then((subFilterDetails) => {
            if (subFilterDetails.subscriptionFilters.length === 0) {
                event.logger.info({ function: func, log: 'assigning subscription filter' });
                const params = {
                    destinationArn: process.env.SumoLogicLambdaARN,
                    filterName: 'sumoLogic',
                    filterPattern: ' ',
                    logGroupName: context.logGroupName
                };
                return cloudwatchlogs.putSubscriptionFilterAsync(params);
            }
            event.logger.info({ function: func, log: 'subscription filter already assigned' });
            return null;
        })
        .catch((err) => {
            event.logger.error({ function: func, log: 'failed to configure logging subscription filter.', err: err.message });
        });
});
