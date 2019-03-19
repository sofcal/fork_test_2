/* eslint-disable no-console */

'use strict';

const { Cache } = require('@sage/bc-data-cache');

const noop = () => {};
const noopLogger = {
    error: noop,
    warn: noop,
    info: noop,
};

class EndpointsStore {
    constructor({
        endpointMappings,
        cacheExpiry,
        cacheClass = Cache,
        refreshFunction,
    }, logger = noopLogger) {
        // mapping ID > endpoint
        this.endpointMappings = endpointMappings;
        // cache expiration limit
        this.cacheExpiry = cacheExpiry;
        // list of caches by ID
        this.cacheList = {};

        // Cache class requires a refresh function (to retrieve data from endpoint and
        // map results to internal storage)
        this.refreshFunction = refreshFunction;
        this.Cache = cacheClass;

        this.logger = logger;
        this.func = 'EndpointsStore.impl';

        validate.call(this);
    }

    // get Data for an ID
    getCache(ID) {
        return Promise.resolve()
            // check if cache exists for ID - if not, create
            .then(() => {
                let IDCache = this.cacheList[ID];

                // if no cache for this ID
                if (!IDCache) {
                    this.logger.info({
                        function: this.func,
                        log: `Building cache for ${ID}`
                    });
                    const endpoint = this.getEndpoint(ID);

                    // create new cache
                    IDCache = this.createCacheEntry(ID, endpoint);
                }
                return undefined;
            })
            // retrieve data from cache
            .then(() => {
                this.logger.info({
                    function: this.func,
                    log: `Getting certificates for ${ID}`
                });
                return this.cacheList[ID].getData();
            });
    }

    // Create a new cache entry for an ID
    createCacheEntry(ID, endpoint) {
        this.cacheList[ID] = new this.Cache({
            endpoint,
            cacheExpiry: this.cacheExpiry,
            refreshFunction: this.refreshFunction,
        }, this.logger);
        return this.cacheList[ID];
    }

    // Get endpoint for an ID from endpointMappings
    getEndpoint(ID) {
        const endpoint = this.endpointMappings[ID];
        // endpoint not known
        if (!endpoint) {
            console.log(`alert: ID not known - ${ID}`);
            throw new Error('IDInvalid');
        }
        return endpoint;
    }
}

function validate() {
    const { refreshFunction, Cache: thisCache, endpointMappings, cacheExpiry, logger } = this;

    if (!refreshFunction || typeof refreshFunction !== 'function') {
        throw new Error('Invalid argument passed: Refresh function is not a function');
    }
    if (!thisCache || typeof thisCache !== 'function' || !thisCache.prototype.getData) {
        throw new Error('Invalid argument passed: cacheClass');
    }
    if (!endpointMappings || typeof endpointMappings !== 'object') {
        throw new Error('Invalid argument passed: endpointMappings not an object');
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
    EndpointsStore
};
