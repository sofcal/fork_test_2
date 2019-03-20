/* eslint-disable no-console */

'use strict';

const needle = require('needle');
const { Jwks } = require('@sage/sfab-s2s-jwt-jwks');
const { Cache } = require('@sage/bc-data-cache');

// set default user agent
needle.defaults({
    user_agent: 'BankDrive'
});

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
    }, logger = noopLogger) {
        // mapping ID > endpoint
        this.endpointMappings = endpointMappings;
        // cache expiration limit
        this.cacheExpiry = cacheExpiry;
        // list of caches by ID
        this.cacheList = {};

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
            refreshFunction: EndpointsStore.refreshFn,
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

    // Refresh function - calls needle get using endpoint argument
    // returns promise
    static refreshFn(endpoint) {
        return Promise.resolve()
            .then(() => needle('get', endpoint))
            .then((res) => EndpointsStore.mappingFn(res))
            .catch((err) => {
                console.log(`alert: ${err}`);
                throw new Error(`Fetch endpoint error: ${err.message}`);
            });
    }

    // Mapping function - maps data to internal storage structure
    // returns object
    static mappingFn(res) {
        const { keys = [] } = res.body;

        return keys.reduce((final, { kid, x5c }) => {
            return Object.assign(
                {},
                final,
                { [kid]: [Jwks.ConvertX5CToPem(x5c[0])] },
            );
        }, {});
    }
}

function validate() {
    const { Cache: thisCache, endpointMappings, cacheExpiry, logger } = this;

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
