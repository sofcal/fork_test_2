'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');

const noop = () => {};
const isFunction = (property) => {
    return property && typeof property === 'function';
};

const defaultLogger = (logger) => {
    if (logger && isFunction(logger.info) && isFunction(logger.error)) {
        return logger;
    }

    return { debug: noop, info: noop, warning: noop, error: noop };
};

class CloudWatchSubscription {
    static Register(logGroupName, destinationArn, logger = defaultLogger(logger)) {
        const func = 'cloudwatch-subscription.register';
        const cloudWatchLogs = Promise.promisifyAll(new AWS.CloudWatchLogs());

        return cloudWatchLogs.describeSubscriptionFiltersAsync({ logGroupName })
            .then((subFilterDetails) => {
                if (subFilterDetails.subscriptionFilters.length > 0) {
                    logger.info({ function: func, log: 'subscription filter already assigned' });
                    return null;
                }

                logger.info({ function: func, log: 'assigning subscription filter' });
                const params = {
                    destinationArn,
                    filterName: 'sumoLogic',
                    filterPattern: ' ',
                    logGroupName: logGroupName
                };
                return cloudWatchLogs.putSubscriptionFilterAsync(params);
            })
            .catch((err) => {
                logger.error({
                    function: func,
                    log: 'failed to configure logging subscription filter.',
                    err: err.message
                });
            });
    }
}

module.exports = CloudWatchSubscription;
