'use strict';

class JWKSStore {
    constructor(serviceMappings, jwksDelay) {
        this.serviceMappings = serviceMappings;
        this.jwksDelay = jwksDelay;
    }

    retrieveCertList(serviceID) {
        return Promise.resolve()
            .then(() => {
                const endPoint = this.serviceMappings[serviceID];
                if (!endPoint) {
                    throw new Error('authTokenIssuerInvalid');
                };
                return endPoint;
            })
            .then((endPoint) => {

            });
    }
}

module.exports = {
    JWKSStore
};
