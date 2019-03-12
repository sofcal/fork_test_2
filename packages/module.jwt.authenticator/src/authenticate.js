'use strict';

// TODO error codes?

const jwt = require('jsonwebtoken');
const utils = require('./utils');
const { omit } = require('underscore');

class Authenticate {
    constructor(authToken, validIssuers, JwksCachingService, logger) {
        this.func = 'Authenticate.impl';
        this.logger = logger;

        const decode = jwt.decode(authToken);

        if (decode === null) {
            this.logger.error({ function: this.func, log: `Unable to decode JWT token: ${authToken}` });
            throw new Error('invalidAuthToken');
        }

        this.exp = decode.exp;
        this.kid = decode.kid;
        this.iss = decode.iss;

        // TODO check correct claims returned + test
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
            })
            .catch((err) => {
                this.logger.warn({ function: this.func, log: `Error populating certificate list: ${err.message}` });
                throw err;
            });
    }

    checkAuthorisation() {
        return Promise.resolve()
            .then(() => this.populateCertList())
            .then(() => {
                const verifyToken = utils.partial(jwt.verify, this.authToken);
                const validTokenFound = utils.anyValid(this.certKeys, verifyToken);

                if (!validTokenFound) {
                    this.logger.error({ function: this.func, log: `Authorisation failed for token, issuer ${this.iss}` });
                    throw new Error('AuthFailed');
                }

                this.logger.info({ function: this.func, log: 'Token authorised' });
                return {
                    authorised: true,
                    claims: this.claims,
                };
            })
            .catch((err) => {
                this.logger.warn({ function: this.func, log: `Error checking authorisation: ${err.message}` });
                throw err;
            });
    }
}

module.exports = {
    Authenticate
};
