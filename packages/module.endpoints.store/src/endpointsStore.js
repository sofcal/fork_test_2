/* eslint-disable no-console */

'use strict';

const { Cache } = require('@sage/bc-data-cache');

const identity = ((data) => data);

class EndpointsStore {
    constructor({
        endpointMappings,
        cacheExpiry,
        logger,
        cacheClass = Cache,
        refreshFunction,
        mappingFunction = identity
    }) {
        // mapping ID > endpoint
        this.endpointMappings = endpointMappings;
        // cache expiration limit
        this.cacheExpiry = cacheExpiry;
        // list of caches by ID
        this.cacheList = {};

        // Cache class requires a refresh function (to retrieve data from endpont), and
        // a mapping function (to map results to internal storage)
        this.refreshFunction = refreshFunction;
        this.mappingFunction = mappingFunction;
        this.Cache = cacheClass;

        this.logger = logger;
        this.func = 'EndpointsStore.impl';
    }

    // get Data for an ID
    getData(ID) {
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
                    const endPoint = this.getEndPoint(ID);

                    // create new cache
                    IDCache = this.createCacheEntry(ID, endPoint);

                    // populate the cache
                    return IDCache.buildCache();
                }
                return undefined;
            })
            // retrieve certs from cache
            .then(() => {
                this.logger.info({
                    function: this.func,
                    log: `Getting certificates for ${ID}`
                });
                return this.cacheList[ID].getCerts();
            });
    }

    // Create a new cache entry for an ID
    createCacheEntry(ID, endPoint) {
        this.cacheList[ID] = new this.Cache({
            endPoint,
            cacheExpiry: this.cacheExpiry,
            logger: this.logger,
            mappingFunction: this.mappingFunction,
            refreshFunction: this.refreshFunction,
        });
        return this.cacheList[ID];
    }

    // Get endpoint for an ID from endpointMappings
    getEndPoint(ID) {
        const endPoint = this.endpointMappings[ID];
        // endpoint not known
        if (!endPoint) {
            console.log(`alert: ID not known - ${ID}`);
            throw new Error('IDInvalid');
        }
        return endPoint;
    }
}

module.exports = {
    EndpointsStore
};
