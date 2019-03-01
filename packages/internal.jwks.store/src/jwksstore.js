'use strict';

const { JWKSCache } = require('./jwkscache');

class JWKSStore {
    constructor(serviceMappings = {}, jwksDelay = 0) {
        // mapping serviceID > endpoint
        this.serviceMappings = serviceMappings;
        // Delay jwks
        this.jwksDelay = jwksDelay;
        // cached entries for serviceID
        this.cacheList = {};
    }

    // get Certificate list
    getCertList(serviceID) {
        return Promise.resolve()
            // check if serviceID cached exists - if not, create
            .then(() => {
                let serviceIDCache = this.cacheList[serviceID];

                if (!serviceIDCache) {
                    const endPoint = this.serviceMappings[serviceID];
                    if (!endPoint) {
                        throw new Error('authTokenIssuerInvalid');
                    }

                    // create new cache
                    this.cacheList[serviceID] = new JWKSCache(endPoint, this.jwksDelay);
                    serviceIDCache = this.cacheList[serviceID];
                    // populate the cache
                    return serviceIDCache.buildCache();
                }
                return undefined;
            })
            // retrieve certs from cache
            .then(() => this.cacheList[serviceID].getCerts());
    }
}

module.exports = {
    JWKSStore
};
