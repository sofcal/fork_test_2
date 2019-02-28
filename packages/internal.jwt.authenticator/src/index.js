'use strict';

const jwt = require('jsonwebtoken');
const validateToken = require('./validateToken');

class Authenticate {
    constructor(authToken = '', validIssuers, JwksCachingService) {
        let exp,
            iss,
            kid;

        try {
            ({exp, iss, kid} = jwt.decode(authToken));

            this.exp = exp;
            this.iss = iss;
            this.kid = kid;
        } catch (e) {
            throw new Error('invalidAuthToken');
        }

        this.authToken = authToken;
        this.cachingService = JwksCachingService;

        this.certKeys = [];

        this.validIssuers = validIssuers;
    }

    validate() {
        return Promise.resolve()
            .then(() => validateToken(this.exp, this.iss, this.validIssuers));
    }

    getCertList() {
        return Promise.resolve()
            .then(() => this.cachingService.retrieveCertList(this.iss, this.kid))
            .then((arr) => {
                this.certKeys = arr;
            });
    }

    checkAuthorisation() {
        return Promise.resolve()
            .then(() => {
                if (!(this.certKeys.some(key => {
                    try {
                        jwt.verify(this.authToken, key);
                        return true;
                    } catch (e) {
                        return false;
                    }
                }))) {
                    throw new Error('AuthFailed');
                }

                return 'Authorised';
            });
    }
}

module.exports = {
    Authenticate
};
