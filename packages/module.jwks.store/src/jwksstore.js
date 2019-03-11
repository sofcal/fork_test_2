/* eslint-disable no-console */

'use strict';

const { JWKSCache } = require('./jwkscache');

class JWKSStore {
    constructor(serviceMappings, jwksDelay, logger, cacheClass = JWKSCache) {
        // mapping serviceID > endpoint
        this.serviceMappings = serviceMappings;
        // Delay jwks
        this.jwksDelay = jwksDelay;
        // cached entries for serviceID
        this.cacheList = {};
        this.Cache = cacheClass;
        this.logger = logger;
        this.func = 'JWKSStore.impl';
    }

    // get Certificate list
    getCertList(serviceID) {
        return Promise.resolve()
            // check if serviceID cached exists - if not, create
            .then(() => {
                let serviceIDCache = this.cacheList[serviceID];

                // if no cache for this service
                if (!serviceIDCache) {
                    this.logger.info({ function: this.func, log: `Building cache for ${serviceID}` });
                    const endPoint = this.getEndPoint(serviceID);

                    // create new cache
                    serviceIDCache = this.createCacheEntry(serviceID, endPoint);
                    // populate the cache
                    return serviceIDCache.buildCache();
                }
                return undefined;
            })
            // retrieve certs from cache
            .then(() => {
                this.logger.info({ function: this.func, log: `Getting certificates for ${serviceID}` });
                return this.cacheList[serviceID].getCerts();
            });
    }

    createCacheEntry(serviceID, endPoint) {
        this.cacheList[serviceID] = new this.Cache(endPoint, this.jwksDelay, this.logger);
        return this.cacheList[serviceID];
    }

    getEndPoint(serviceID) {
        const endPoint = this.serviceMappings[serviceID];
        // endpoint not known
        if (!endPoint) {
            console.log(`alert: Auth token issuer not known - ${serviceID}`);
            throw new Error('authTokenIssuerInvalid');
        }
        return endPoint;
    }
}

module.exports = {
    JWKSStore
};
