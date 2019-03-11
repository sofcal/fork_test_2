'use strict';

const jwt = require('jsonwebtoken');
const utils = require('./utils');
const { omit } = require('underscore');

class Authenticate {
    constructor(authToken, validIssuers, JwksCachingService, logger) {
        this.func = 'Authenticate.impl';
        this.logger = logger;

        let decode;
        try {
            decode = jwt.decode(authToken);
        } catch (e) {
            this.logger.error({ function: this.func, log: `Unable to decode JWT token: ${authToken}` });
            throw new Error('invalidAuthToken');
        }

        if (decode === null) {
            this.logger.error({ function: this.func, log: `Unable to decode JWT token: ${authToken}` });
            throw new Error('invalidAuthToken');
        }

        ({
            exp: this.exp,
            iss: this.iss,
            kid: this.kid,
        } = decode);

        // store custom claims (drop any Registered Claim Names)
        const registeredClaims = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'];
        this.claims = omit(decode, registeredClaims);

        this.authToken = authToken;
        this.cachingService = JwksCachingService;

        this.certKeys = [];

        this.validIssuers = validIssuers;
    }

    validate() {
        return Promise.resolve()
            .then(() => utils.validateToken(this.exp, this.iss, this.validIssuers))
            .catch((err) => {
                this.logger.info({ function: this.func, log: `Token failed validation: ${err.message}` });
                throw err;
            });
    }

    populateCertList() {
        return Promise.resolve()
            .then(() => {
                this.logger.info({ function: this.func, log: `Populating certificates for ${this.iss}` });
                return this.cachingService.getCertList(this.iss, this.kid);
            })
            .then((list) => {
                this.certKeys = list[this.kid];
                this.logger.info({ function: this.func, log: 'Certificate list populated' });
                return this.certKeys;
            });
    }

    checkAuthorisation() {
        return Promise.resolve()
            .then(() => this.populateCertList())
            .then(() => {
                const verifyToken = utils.partial(jwt.verify, this.authToken);
                const validTokenFound = utils.anyValid(this.certKeys, verifyToken);

                if (!validTokenFound) {
                    this.logger.error({ function: this.func, log: `Validation failed for token, issuer ${this.iss}` });
                    throw new Error('AuthFailed');
                }

                this.logger.info({ function: this.func, log: 'Token authorised' });
                return {
                    authorised: true,
                    claims: this.claims,
                };
            });
    }
}

module.exports = {
    Authenticate
};
