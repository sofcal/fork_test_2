'use strict';

const jwt = require('jsonwebtoken');
const { validateToken, firstValid, partial } = require('./utils');

class Authenticate {
    constructor(authToken = '', validIssuers, JwksCachingService) {
        let exp;
        let iss;
        let kid;

        try {
            ({ exp, iss, kid } = jwt.decode(authToken));

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
            .then(() => this.cachingService.getCertList(this.iss, this.kid))
            .then((arr) => {
                this.certKeys = arr;
            });
    }

    checkAuthorisation() {
        return Promise.resolve()
            .then(() => this.getCertList())
            .then(() => {
                const verifyToken = partial(jwt.verify, this.authToken);
                const validTokenFound = firstValid(this.certKeys, verifyToken);

                if (!validTokenFound) {
                    throw new Error('AuthFailed');
                }

                return 'Authorised';
            });
    }
}

module.exports = {
    Authenticate
};
