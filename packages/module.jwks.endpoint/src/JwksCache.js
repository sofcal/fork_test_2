'use strict';

const BCCache = require('@sage/bc-data-cache');

let self;

const DEFAULT_CACHE_TTL = 600;

class JwksCache {
    constructor(config, logger, parameterStore) {
        const cacheExpiry = config.cacheExpiry || DEFAULT_CACHE_TTL;
        this.cache = new BCCache.Cache({
            undefined,
            cacheExpiry,
            logger,
            refreshFunction,
            mappingFunction
        });

        this.parameterStore = parameterStore;
        this.paramPrefix = config.paramPrefix;

        self = this;
    }

    getParams() {
        return this.cache.getData();
    }
}

const mappingFunction = (data) => data;

const refreshFunction = () => {  // TODO: check it
    return self.parameterStore.getParameters([
        `${self.paramPrefix}accessToken.primary.publicKey`,
        `${self.paramPrefix}accessToken.secondary.publicKey`
    ]);
};

module.exports = JwksCache;
