'use strict';

const jwt = require('jsonwebtoken');
const utils = require('./utils');

class Authenticate {
    constructor(authToken = '', validIssuers = [], JwksCachingService) {
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
            .then(() => utils.validateToken(this.exp, this.iss, this.validIssuers));
    }

    getCertList() {
        return Promise.resolve()
            .then(() => this.cachingService.getCertList(this.iss, this.kid))
            .then((list) => {
                this.certKeys = list[this.kid];
            });
    }

    checkAuthorisation() {
        return Promise.resolve()
            .then(() => this.getCertList())
            .then(() => {
                const verifyToken = utils.partial(jwt.verify, this.authToken);
                const validTokenFound = utils.anyValid(this.certKeys, verifyToken);

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
