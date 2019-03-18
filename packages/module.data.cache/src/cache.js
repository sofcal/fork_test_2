/* eslint-disable no-console */

'use strict';

// identity function - returns input
const identityfn = (data) => data;

// Cache of data for an endpoint
class Cache {
    constructor({
        endpoint,
        cacheExpiry,
        logger,
        refreshFunction,
        mappingFunction = identityfn, // default to identity function
    }) {
        this.endpoint = endpoint;
        this.cacheExpiry = cacheExpiry;
        this.logger = logger;
        if (typeof refreshFunction === 'function') {
            this.refreshFunction = refreshFunction.bind(this, this.endpoint); // called in fetchEndPoint
        }
        this.mappingFunction = mappingFunction; // called in buildCache

        this.func = 'Cache.impl';

        this.data = {};
        this.currentRefresh = null; // set in getData, reset in buildCache
        this.refreshTime = 0;

        validate.call(this);
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
            // map respone to data storage using mappingFunction parameter
            .then(this.mappingFunction)
            // update storage
            .then((data) => {
                this.data = data;
                this.refreshTime = Math.floor(Date.now() / 1000);
                // refresh complete, so reset currentRefresh
                this.currentRefresh = null;
            })
            .catch((err) => {
                this.logger.error({
                    function: this.func,
                    log: `Error building cache: ${err}`
                });
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
                        this.logger.info({
                            function: this.func,
                            log: 'Existing refresh running, waiting for completion'
                        });
                        return this.currentRefresh;
                    }
                    // otherwise start a new refresh
                    this.logger.info({
                        function: this.func,
                        log: `endpoint ${this.endpoint} cache expired, refreshing`
                    });
                    this.currentRefresh = this.buildCache(); // this will return a promise
                    return this.currentRefresh;
                }
                // no refresh required
                return undefined;
            })
            // return data
            .then(() => this.data);
    }

    // refresh endpoint - runs refreshFunction parameter
    fetchEndPoint() {
        this.logger.info({
            function: this.func,
            log: `Fetching data from endpoint ${this.endpoint}`
        });
        return Promise.resolve()
            .then(this.refreshFunction)
            .catch((err) => {
                console.log(`alert: ${err}`);
                throw new Error(`Fetch endpoint error: ${err.message}`);
            });
    }
}

function validate() {
    const { refreshFunction, mappingFunction, endpoint, cacheExpiry, logger } = this;

    if (!refreshFunction || typeof refreshFunction !== 'function') {
        throw new Error('Invalid argument passed: Refresh function is not a function');
    }
    if (!mappingFunction || typeof mappingFunction !== 'function') {
        throw new Error('Invalid argument passed: Mapping function is not a function');
    }
    if (!endpoint || typeof endpoint !== 'string') {
        throw new Error('Invalid argument passed: Endpoint not a string');
    }
    if (!cacheExpiry || typeof cacheExpiry !== 'number') {
        throw new Error('Invalid argument passed: CacheExpiry not a number');
    }
    if (!logger || typeof logger !== 'object') {
        throw new Error('Invalid argument passed: Logger not an object');
    }
    if (!logger.info || !logger.error) {
        throw new Error('Invalid argument passed: Logger not valid');
    }
}

module.exports = {
    Cache
};
