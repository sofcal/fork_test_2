'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');
const impl = require('./impl');
const ErrorSpecs = require('./ErrorSpecs');
const serviceLoader = require('./serviceLoader');

const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const { RequestLogger } = require('@sage/bc-request-logger');
const { StatusCodeError } = require('@sage/bc-status-code-error');

const DB = require('@sage/bc-services-db');

const serviceImpls = { DB };

const keys = require('./params');

class Handler {
    static run(event, context, callback) {
        const func = 'handler.run';
        const { Environment: env = 'test', AWS_REGION: region = 'local' } = process.env;
        const services = {};
        return Promise.resolve(undefined)
            .then(() => {
                // eslint-disable-next-line no-param-reassign
                event.logger = RequestLogger.Create({ service: 'lambda-antivirus-definitions' });
                if (!env || !region) {
                    const log = `invalid parameters - env: ${env}; region: ${region};`;
                    event.logger.error({ function: func, log });
                    throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent], ErrorSpecs.invalidEvent.statusCode);
                }

                return setupLogGroupSubscription(event, context)
                    .then(() => getParams({ env, region }, event.logger))
                    .then((params) => {
                        return populateServices(services, { env, region, params }, event.logger)
                            .then(() => params);
                    });
            })
            .then((params) => impl.run(event, context, params, services))
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
            });
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
        .then(() => {
            const retrievedCount = Object.keys(params).length;

            logger.info({ function: func, log: 'finished retrieving param-store keys', requested: keys.length, retrieved: retrievedCount });

            // intentional - have param store overrides

            //if (!retrievedCount || retrievedCount < keys.length) {
            //    throw StatusCodeError.CreateFromSpecs([ErrorSpecs.failedToRetrieveParameters], ErrorSpecs.failedToRetrieveParameters.statusCode);
            //}

            logger.info({ function: func, log: 'ended' });
            return params;
        });
};

const populateServices = Promise.method((services, { env, region, params }, logger) => {
    const func = 'handler.populateServices';
    logger.info({ function: func, log: 'started' });
    // add any additional services that are created by the serviceLoader for the lambda
    Object.assign(services, serviceLoader({ env, region, params, logger }));

    logger.info({ function: func, log: 'ended' });
    return services;
});

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
    services.db = serviceImpls.DB.Create({ env, region, domain, username, password, replicaSet });

    return services.db.connect('bank_db')
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

module.exports.run = Handler.run;
