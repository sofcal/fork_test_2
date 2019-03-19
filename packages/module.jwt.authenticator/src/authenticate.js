'use strict';

const jwt = require('jsonwebtoken');
const utils = require('./utils');
const { omit } = require('underscore');

const noop = () => {};
const noopLogger = {
    error: noop,
    warn: noop,
    info: noop,
};

class Authenticate {
    constructor({
        validIssuers,
        storeService,
    }, logger = noopLogger) {
        this.func = 'Authenticate.impl';
        this.logger = logger;
        this.storeService = storeService;
        this.certKeys = [];
        this.validIssuers = validIssuers;
    }

    populateCertList(token) {
        return Promise.resolve()
            .then(() => this.decodeToken(token))
            .then(() => {
                this.logger.info({
                    function: this.func,
                    log: `Populating certificates for ${this.iss}`
                });
                return this.storeService.getCache(this.iss);
            })
            .then((list) => {
                this.certKeys = list[this.kid];
                this.logger.info({
                    function: this.func,
                    log: 'Certificate list populated',
                    list
                });
                return this.certKeys;
            })
            .catch((err) => {
                this.logger.warn({
                    function: this.func,
                    log: `Error populating certificate list: ${err.message}`
                });
                throw err;
            });
    }

    decodeToken(authToken) {
        const decode = jwt.decode(authToken);

        if (decode === null) {
            this.logger.error({
                function: this.func,
                log: `Unable to decode JWT token: ${authToken}`
            });
            throw new Error('invalidAuthToken');
        }

        this.authToken = authToken;
        this.exp = decode.exp;
        this.kid = decode.kid;
        this.iss = decode.iss;

        // store custom claims (drop any Registered Claim Names)
        const registeredClaims = [
            'iss',
            'sub',
            'aud',
            'exp',
            'nbf',
            'iat',
            'jti'
        ];
        this.claims = omit(decode, registeredClaims);

        this.validate();
    }

    validate() {
        try {
            utils.validateToken(this.exp, this.iss, this.validIssuers);
        } catch (err) {
            this.logger.error({
                function: this.func,
                log: `Token failed validation: ${err.message}`
            });
            throw err;
        }
        return true;
    }

    checkAuthorisation(token) {
        return Promise.resolve()
            .then(() => this.populateCertList(token))
            .then(() => {
                const verifyToken = utils.partial(jwt.verify, this.authToken);
                const validTokenFound = utils.anyValid(this.certKeys, verifyToken);
                this.logger.info({
                    function: this.func,
                    log: `Validating against certkeys ${this.certKeys}`,
                });

                if (!validTokenFound) {
                    this.logger.error({
                        function: this.func,
                        log: `Authorisation failed for token, issuer ${this.iss}`
                    });
                    throw new Error('AuthFailed');
                }

                this.logger.info({
                    function: this.func,
                    log: 'Token authorised'
                });
                return {
                    authorised: true,
                    claims: this.claims,
                };
            })
            .catch((err) => {
                this.logger.warn({
                    function: this.func,
                    log: `Error checking authorisation: ${err.message}`
                });
                throw err;
            });
    }
}

module.exports = {
    Authenticate
};
