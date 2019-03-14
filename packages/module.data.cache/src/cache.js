/* eslint-disable no-console */

'use strict';

const identity = ((data) => data);

// Cache of data for an endpoint
class Cache {
    constructor({
        endpoint,
        cacheExpiry,
        logger,
        refreshFunction,
        mappingFunction = identity
    }) {
        this.endpoint = endpoint;
        this.cacheExpiry = cacheExpiry;
        this.logger = logger;
        this.refreshFunction = refreshFunction;
        this.mappingFunction = mappingFunction;

        this.func = 'Cache.impl';

        this.data = {};
        this.currentRefresh = null;
    }

    // check last refresh time hasn't passed expiry point
    cacheExpired() {
        return Math.floor(Date.now() / 1000) > (this.refreshTime + this.cacheExpiry);
    }

    // Empty existing cache, then call endpoint to get new data
    buildCache() {
        return Promise.resolve()
            // empty old cache
            .then(() => {
                this.data = {};
            })
            // call endpoint
            .then(() => this.fetchEndPoint())
            // map respone to data storage
            .then(this.mappingFunction)
            // update storage
            .then((data) => {
                this.data = data;
                this.refreshTime = Math.floor(Date.now() / 1000);
                this.currentRefresh = null;
            })
            .catch((err) => {
                this.logger.error({ function: this.func, log: `Error building cache: ${err}` });
                throw err;
            });
    }

    // get Data - return from cache if not expired,
    // otherwise check if current in-flight refresh, if not call buildCache to refresh
    getData() {
        return Promise.resolve()
            // check if cache needs to be refreshed
            .then(() => {
                if (this.cacheExpired()) {
                    // check for existing refresh
                    if (this.currentRefresh) {
                        this.logger.info({ function: this.func, log: 'Existing refresh running, waiting for completion' });
                        return this.currentRefresh;
                    }
                    this.logger.info({ function: this.func, log: `endpoint ${this.endpoint} cache expired, refreshing` });
                    this.currentRefresh = this.buildCache();
                    return this.currentRefresh;
                }
                return undefined;
            })
            // return data
            .then(() => this.data);
    }

    // refresh endpoint
    fetchEndPoint() {
        this.logger.info({ function: this.func, log: `Fetching data from endpoint ${this.endpoint}` });
        return Promise.resolve()
            .then(() => this.refreshFunction())
            .catch((err) => {
                console.log(`alert: ${err}`);
                throw new Error(`Fetch endpoint error: ${err.message}`);
            });
    }
}

module.exports = {
    Cache
};
