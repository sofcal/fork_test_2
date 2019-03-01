'use strict';

const { JWKSCache } = require('./jwkscache');

class JWKSStore {
    constructor(serviceMappings, jwksDelay) {
        this.serviceMappings = serviceMappings;
        this.jwksDelay = jwksDelay;

        // structure:
        //    serviceID:
        //       endpoint:
        //       cachelist: []
        //       refreshTime
        this.cacheList = {};
    }

    getCertList(serviceID) {
        return Promise.resolve()
            .then(() => {
                const serviceIDCache = this.cacheList[serviceID];

                if (!serviceIDCache) {
                    const endPoint = this.serviceMappings[serviceID];
                    if (!endPoint) {
                        throw new Error('authTokenIssuerInvalid');
                    }

                    this.cacheList[serviceID] = new JWKSCache(endPoint, this.jwksDelay);
                }

                return serviceIDCache.getCerts();
            });
    }
}

module.exports = {
    JWKSStore
};
