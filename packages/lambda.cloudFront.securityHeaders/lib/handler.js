'use strict';

const Promise = require('bluebird');
const impl = require('./impl');
const ErrorSpecs = require('./ErrorSpecs');

const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const { RequestLogger } = require('@sage/bc-request-logger');
const { StatusCodeError } = require('@sage/bc-status-code-error');

const keys = require('./params');
const AWS = require('aws-sdk');

const hoursDelayBetweenParamRefresh = 2;

let paramsCache = null;
let nextReadParams = null;

module.exports.run = (event, context, callback) => {
    const func = 'handler.run';

    // eslint-disable-next-line no-param-reassign
    event.logger = RequestLogger.Create({ service: 'cloudFront-SecurityHeaders' });
    event.logger.info({ function: func, log: 'started' });

    const request = event.Records[0].cf.request; // eslint-disable-line prefer-destructuring
    const environment = request.origin.s3.customHeaders.environment;
    const envObj = environment.find(obj => obj.key === 'Environment')
    const env = envObj.value;
    const region = 'eu-west-1'; // set to force lambda to get param store values from fixed region and not region it is running in

    return Promise.resolve(undefined)
        .then(() => {
            if (!env || !region) {
                const log = `invalid parameters - env: ${env}; region: ${region};`;
                event.logger.error({ function: func, log });
                throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent], ErrorSpecs.invalidEvent.statusCode);
            }

            return setupLogGroupSubscription(event, context)
                .then(() => {
                    if (paramsCache && Date.now() < nextReadParams) {
                        event.logger.info({ function: func, log: 'get from paramsCache', nextReadParams: nextReadParams.toISOString() });
                        return paramsCache;
                    }
                    event.logger.info({ function: func, log: 'get params' });
                    return getParams({ env, region }, event.logger)
                        .then((params) => {
                            paramsCache = params;
                            nextReadParams = new Date(Date.now());
                            nextReadParams.setHours(nextReadParams.getHours() + hoursDelayBetweenParamRefresh);
                            event.logger.info({ function: func, log: 'set paramsCache and return cache', nextReadParams: nextReadParams.toISOString() });
                            return params;
                        });
                });
        })
        .then((params) => impl.run(event, params))
        .then((response) => {
            event.logger.info({ function: func, log: 'returning updated response' });
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
        });
};

const getParams = ({ env, region }, logger) => {
    const func = 'handler.getParams';
    logger.info({ function: func, log: 'started' });

    const paramPrefix = `/${env}/`;
    const params = {};

    logger.info({ function: func, log: 'retrieving keys', keys, paramPrefix, env, region });

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

const setupLogGroupSubscription = Promise.method((event, context) => {
    const func = 'handler.setupLogGroupSubscription';
    event.logger.info({ function: func, log: 'started' });
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
                event.logger.info({ function: func, log: 'completed' });
                return cloudwatchlogs.putSubscriptionFilterAsync(params);
            }
            event.logger.info({ function: func, log: 'subscription filter already assigned' });
            return null;
        })
        .catch((err) => {
            event.logger.error({ function: func, log: 'failed to configure logging subscription filter.', err: err.message });
        });
});
