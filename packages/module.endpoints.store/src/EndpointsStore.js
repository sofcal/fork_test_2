/* eslint-disable no-console */

'use strict';

const needle = require('needle');
const { Jwks } = require('@sage/sfab-s2s-jwt-jwks');
const { Cache } = require('@sage/sfab-s2s-jwt-cache');

const Promise = require('bluebird');

// set default user agent
needle.defaults({
    user_agent: 'BankDrive' // todo, service id?
});

const noop = () => {};
const noopLogger = { error: noop, warn: noop, info: noop, };

class EndpointsStore {
    constructor({ endpointMappings, refreshDelay, cacheClass = Cache }, { logger = noopLogger } = {}) {
        this.endpointMappings = endpointMappings;       // mapping ID > endpoint
        this.validIds = Object.keys(endpointMappings);  // list of valid Ids
        this.refreshDelay = refreshDelay;               // cache expiration limit
        this.cacheList = {};                            // list of caches by ID

        this._needle = Promise.promisifyAll(needle);
        this._Cache = cacheClass;
        this.logger = logger;

        this.validate();
    }

    static Create(...args) {
        return new EndpointsStore(...args);
    }

    getValidIds() {
        return this.validIds;
    }

    // get Data for an ID
    getCache(ID, tryRefresh = true) {
        const func = `${EndpointsStore.name}.getCache`;
        return Promise.resolve(undefined)
            // check if cache exists for ID - if not, create
            .then(() => {
                // if no cache for this ID
                if (!this.cacheList[ID]) {
                    this.logger.info({ function: func, log: 'building cache', params: { id: ID } });
                    const endpoint = this.getEndpoint(ID);

                    // create new cache
                    this.cacheList[ID] = this.createCacheEntry(ID, endpoint);
                }
            })
            // if kid does not exist in cache
            // retrieve data from cache
            .then(() => {
                const allowRefresh = Math.floor(Date.now() / 1000) > (this.cacheList[ID].refreshTime + this.refreshDelay);
                this.logger.info({
                    function: func,
                    log: 'getting certificates',
                    params: { id: ID, tryRefresh, allowRefresh, refreshTime: this.cacheList[ID].refreshTime, refreshDelay: this.refreshDelay }
                });

                const refresh = tryRefresh && allowRefresh;
                return this.cacheList[ID].getData(refresh);
            });
    }

    // Create a new cache entry for an ID
    createCacheEntry(ID, endpoint) {
        const refreshFunction = this.createRefreshFunction(endpoint, ID);
        return this._Cache.Create({ cacheExpiry: -1, refreshFunction, }, { logger: this.logger });
    }

    // Get endpoint for an ID from endpointMappings
    getEndpoint(ID) {
        const func = `${EndpointsStore.name}.getEndpoint`;
        const endpoint = this.endpointMappings[ID];
        // endpoint not known
        if (!endpoint) {
            this.logger.info({ function: func, log: 'unknown ID', params: { id: ID, alert: true } });
            throw new Error('IDInvalid');
        }
        return endpoint;
    }

    // Refresh function - calls needle get using endpoint argument
    // returns promise
    createRefreshFunction(endpoint, ID) {
        return Promise.method(() => {
            const func = `${EndpointsStore.name}.refreshFunction.${endpoint}`;
            this.logger.info({ function: func, log: 'refreshing cache', params: { endpoint } });

            const options = ID === 'wpb-auth' ? { headers: { 'X-Application': 'sage.uki.50.accounts' } } : undefined;
            return this._needle.getAsync(endpoint, options)
                .then((res) => EndpointsStore.mappingFn(res, ID))
                .catch((err) => {
                    this.logger.info({ function: func, log: 'error calling endpoint', params: { endpoint, error: err.message, alert: true } });
                    throw new Error(`Fetch endpoint error: ${err.message}`);
                });
        });
    }

    // Mapping function - maps data to internal storage structure
    // returns object
    static mappingFn(res, ID) {
        const { keys = [] } = res.body;

        return keys.reduce((final, { kid, x5c }) => {
            return Object.assign(
                final,
                { [kid]: [Jwks.ConvertX5CToPem(x5c[0], ID === 'wpb-auth')] }, // TODO should determine type from JWKS data
            );
        }, {});
    }

    validate() {
        if (!this._Cache || typeof this._Cache !== 'function' || !this._Cache.prototype.getData) {
            throw new Error('Invalid argument passed: cacheClass');
        }
        if (!this.endpointMappings || typeof this.endpointMappings !== 'object') {
            throw new Error('Invalid argument passed: endpointMappings not an object');
        }
        if (!this.refreshDelay || typeof this.refreshDelay !== 'number') {
            throw new Error('Invalid argument passed: refreshDelay not a number');
        }
        if (!this.logger || typeof this.logger !== 'object') {
            throw new Error('Invalid argument passed: Logger not an object');
        }
        if (!this.logger.info || !this.logger.error) {
            throw new Error('Invalid argument passed: Logger not valid');
        }
    }
}

module.exports = {
    EndpointsStore
};
