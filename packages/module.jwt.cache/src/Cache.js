/* eslint-disable no-console */

'use strict';

const Promise = require('bluebird');

const noop = () => {};
const noopLogger = { error: noop, warn: noop, info: noop };

// Cache of data
class Cache {
    constructor({ cacheExpiry, refreshFunction, }, { logger = noopLogger } = {}) {
        this.cacheExpiry = cacheExpiry;
        this.logger = logger;
        this.refreshFunction = refreshFunction; // called in fetch

        this.data = {};
        this.currentRefresh = null; // set in getData, reset in buildCache
        this.refreshTime = 0;

        this.validate();
    }

    validate() {
        const { refreshFunction, cacheExpiry, logger } = this;

        if (!refreshFunction || typeof refreshFunction !== 'function') {
            throw new Error('Invalid argument passed: Refresh function is not a function');
        }
        if (!cacheExpiry || typeof cacheExpiry !== 'number') {
            throw new Error('Invalid argument passed: CacheExpiry not a number');
        }
        if (!logger || typeof this.logger !== 'object' || !logger.info || !logger.error) {
            throw new Error('Invalid argument passed: Logger not valid');
        }
    }

    static Create(...args) {
        return new Cache(...args);
    }

    // check last refresh time hasn't passed expiry point
    // expiry time of -1 indicates no expiry time
    cacheExpired() {
        return this.cacheExpiry === -1 ? false : Math.floor(Date.now() / 1000) > (this.refreshTime + this.cacheExpiry);
    }

    // Empty existing cache, then call fetch() to get new data
    buildCache() {
        const func = `${Cache.name}.buildCache`;
        return Promise.resolve(undefined)
            // call fetch to refresh data
            .then(() => this.fetch())
            // update storage
            .then((data) => {
                this.data = data;
                this.refreshTime = Math.floor(Date.now() / 1000);
                this.logger.info({ function: func, log: 'cache refreshed' });
            })
            .catch((err) => {
                this.currentRefresh = null;
                this.logger.error({ function: func, log: 'error building cache', params: { error: err.message } });
                throw err;
            })
            .finally(() => {
                // refresh complete, so reset currentRefresh
                this.currentRefresh = null;
            });
    }

    // get Data - return from cache if not expired,
    // otherwise check if current in-flight refresh, if not call buildCache to refresh
    getData(forceRefresh = false) {
        const func = `${Cache.name}.getData`;
        return Promise.resolve(undefined)
            // check if cache needs to be refreshed
            .then(() => {
                // if a refresh is already in flight, we just await the result of that - this cache isn't lazy, so we always
                // return the latest results
                if (this.currentRefresh) {
                    this.logger.info({ function: func, log: 'existing refresh running, waiting for completion' });
                    return this.currentRefresh;
                }

                // otherwise we can check whether or not we should perform a refresh
                if (forceRefresh || this.cacheExpired()) {
                    // otherwise start a new refresh
                    this.logger.info({ function: func, log: 'cache expired, refreshing' });
                    this.currentRefresh = this.buildCache(); // this will return a promise
                    return this.currentRefresh;
                }

                // and if none of those things, we can just return
                return undefined;
            })
            // return data
            .then(() => this.data);
    }

    // fetch - runs refreshFunction parameter
    fetch() {
        const func = `${Cache.name}.fetch`;
        this.logger.info({ function: func, log: 'fetching data' });

        return Promise.resolve(undefined)
            .then(() => {
                return this.refreshFunction();
            })
            .catch((err) => {
                this.logger.info({ function: func, log: 'error in refresh function', params: { error: err.message, alert: true } });
                throw new Error(`Refresh error: ${err.message}`);
            });
    }
}

module.exports = Cache;
