'use strict';

const serviceNames = require('@sage/bc-services-names');

const access = require('safe-access');
const Promise = require('bluebird');

/**
 * Collection of helper functions - copied from bankdrive/lib/common/helpers.js
*/

const helpersWrapper = function(sssManager, framework) {
    let cachedConfig = null;
    let checkKeyValuePairCacheStarted = false;

    const getKeyValuePairCacheService = () => {
        try {
            return sssManager.getService(serviceNames.keyValuePairCache);
        } catch (err) {
            return null;
        }
    };

    const helpers = {
        /**
        * retrieves the config object, allows easy stubbing
        */
        getConfig() {
            return framework.common.configuration.get();
        },

        /**
         * Allows to check if featureFlag is enabled - also if in dev env kick off cache polling
         */
        feature: {
            getAllFlags() {
                // for Dev we need to be able to set feature flags dynamically
                // (using helpers.feature.setFlag) this will start off a polling process
                // to keep reading redis to refresh the cached config.
                const checkKeyValuePairCache = Promise.method(() => {
                    // set up key value pair cache service and get polling period
                    const keyValuePairCache = getKeyValuePairCacheService();
                    const cachePollingDelay = access(helpers.getConfig(), 'featureFlags.pollingPeriod') || 200;

                    Promise.resolve()
                        .then(() => {
                            if (!keyValuePairCache) {
                                return undefined; // return early
                            }

                            return keyValuePairCache.retrievePair('featureFlags')
                                .catch(() => {
                                    // key is not present so get from config
                                    return { key: 'featureFlags', value: helpers.getConfig().featureFlags };
                                })
                                .then((keyValuePair) => {
                                    cachedConfig = keyValuePair.value;
                                })
                                .catch(() => {
                                    // catch all errors
                                });
                        })
                        .then(() => {
                            // now after polling period recursively call check cache
                            Promise.delay(cachePollingDelay)
                                .then(() => {
                                    checkKeyValuePairCache();
                                })
                                .catch(() => {
                                    // catch all errors
                                });
                        });
                });

                // if cache set (by checkKeyValuePairCache process) return cached value
                if (cachedConfig) {
                    return cachedConfig;
                }

                // kick off process to poll from redis if in dev enviornment
                const isDevEnv = access(process.env, 'NODE_ENV') === 'dev';
                if (isDevEnv && !checkKeyValuePairCacheStarted) {
                    // required - logs start of polling config polling in dev/integration
                    console.log('starting polling for live config changes'); // eslint-disable-line no-console
                    checkKeyValuePairCache();
                    checkKeyValuePairCacheStarted = true;
                }

                const config = helpers.getConfig();
                if (config) {
                    return config.featureFlags;
                }

                return undefined;
            },

            getFlag(featureType, featureKey) {
                return access(helpers.feature.getAllFlags(), `${featureType}.${featureKey}`);
            },

            isEnabled(featureType, featureKey) {
                if (featureType && featureKey) {
                    return !!helpers.feature.getFlag(featureType, featureKey);
                }
                return false;
            }
        },
    };

    return helpers;
};

module.exports = helpersWrapper;
