'use strict';

const BCCache = require('@sage/bc-data-cache');

const mappingFunction = (data) => data;

let self;

class JwksCache {
    constructor(config, logger, parameterStore) { // TODO: rewrite me
        const refreshFunction = this.refreshFunction;
        const endpoint = config.endpoint;
        const cacheExpiry = config.cacheExpiry;
        this.cache = new BCCache.Cache({
            endpoint, // TODO: check me
            cacheExpiry,
            logger,
            refreshFunction,
            mappingFunction
        });

        this.parameterStore = parameterStore;

        self = this;

        // this.cache.buildCache();
    }

    getParams() {
        return this.cache.getData();
    }

    refreshFunction() {  // TODO: check it
        return self.parameterStore.getParameters([
            `${self.paramPrefix}accessToken.primary.publicKey`,
            `${self.paramPrefix}accessToken.secondary.publicKey`
        ]);
    }
}

module.exports = JwksCache;
