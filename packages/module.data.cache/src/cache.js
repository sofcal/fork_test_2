/* eslint-disable no-console */

'use strict';

const noop = () => {};
const noopLogger = {
    error: noop,
    warn: noop,
    info: noop,
};

// Cache of data
class Cache {
    constructor(
        {
            cacheExpiry,
            refreshFunction,
        },
        {
            logger = noopLogger
        } = {}
    ) {
        this.cacheExpiry = cacheExpiry;
        this.logger = logger;
        this.refreshFunction = refreshFunction; // called in fetch
        this.func = 'Cache.impl';

        this.data = {};
        this.currentRefresh = null; // set in getData, reset in buildCache
        this.refreshTime = 0;

        validate.call(this);
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
        return Promise.resolve()
            // empty old cache
            .then(() => {
                this.data = {};
            })
            // call fetch to refresh data
            .then(() => this.fetch())
            // update storage
            .then((data) => {
                this.data = data;
                this.refreshTime = Math.floor(Date.now() / 1000);
                // refresh complete, so reset currentRefresh
                this.currentRefresh = null;
                this.logger.info({
                    function: this.func,
                    log: `Retrieved ${Object.keys(data).length} kid records`,
                });
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
    getData(forceRefresh = false) {
        return Promise.resolve()
            // check if cache needs to be refreshed
            .then(() => {
                if (forceRefresh || this.cacheExpired()) {
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
                        log: 'Cache expired, refreshing'
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

    // fetch - runs refreshFunction parameter
    fetch() {
        this.logger.info({
            function: this.func,
            log: 'Fetching data'
        });
        return Promise.resolve()
            .then(() => this.refreshFunction())
            .catch((err) => {
                console.log(`alert: ${err}`);
                throw new Error(`Refresh error: ${err.message}`);
            });
    }
}

function validate() {
    const { refreshFunction, cacheExpiry, logger } = this;

    if (!refreshFunction || typeof refreshFunction !== 'function') {
        throw new Error('Invalid argument passed: Refresh function is not a function');
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
