'use strict';

const jwt = require('jsonwebtoken');
const utils = require('./utils');
const _ = require('underscore');

const Promise = require('bluebird');

const noop = () => {};
const noopLogger = { error: noop, warn: noop, info: noop, };

const RegisteredClaims = ['sub', 'aud', 'exp', 'nbf', 'iat', 'jti'];

class Authenticate {
    constructor({ storeService, }, { logger = noopLogger } = {}) {
        this.func = 'Authenticate.impl';
        this.logger = logger;
        this.storeService = storeService;
        this.certKeys = [];

        this.validate();
    }

    validate() {
        // validate this class instance
    }

    static Create(...args) {
        return new Authenticate(...args);
    }

    validateToken(authToken) {
        const func = `${Authenticate.name}.validateToken`;
        const decoded = jwt.decode(authToken, { complete: true });

        if (!decoded) {
            this.logger.error({ function: func, log: 'Unable to decode JWT token' });
            throw new Error('invalidAuthToken');
        }

        try {
            utils.validateToken(decoded, this.storeService.getValidIds());
        } catch (err) {
            this.logger.error({ function: func, log: 'Token failed validation', params: { error: err.message } });
            throw err;
        }

        return decoded.payload;
    }

    getCertKeys({ iss, kid }) {
        const func = `${Authenticate.name}.getCertKeys`;
        return Promise.resolve(undefined)
            .then(() => {
                const doWork = Promise.method((forced = false) => {
                    this.logger.info({ function: func, log: 'pulling certificates from cache', params: { iss, kid, forced } });
                    return this.storeService.getCache(iss, forced)
                        .then((cache) => {
                            this.logger.info({ function: func, log: 'retrieved certificate cache for iss', params: { keys: Object.keys(cache).length, iss, kid, forced } });
                            const certKeys = cache[kid] || [];
                            this.logger.info({ function: func, log: 'filtered certificate list for kid', params: { count: certKeys.length, kid, forced } });
                            return certKeys;
                        });
                });

                // try to get cert info without refreshing
                return doWork()
                    .then((certKeys) => {
                        if (certKeys.length) {
                            return certKeys;
                        }

                        // if no cert exists for the kid, get the cache again but this time with a forced refresh
                        return doWork(true);
                    });
            })
            .catch((err) => {
                this.logger.error({ function: func, log: 'error creating certificate list', params: { error: err.message } });
                throw err;
            });
    }

    checkAuthorisation(token) {
        const func = `${Authenticate.name}.checkAuthorisation`;
        return Promise.resolve(undefined)
            .then(() => {
                // check the basics of the token which don't require certs
                return this.validateToken(token);
            })
            .then((claims) => {
                const { iss, kid } = claims;
                // retrieve the appropiate certs for this token
                return this.getCertKeys(claims)
                    .then((certKeys) => {
                        if (!certKeys.length) {
                            this.logger.error({ function: func, log: 'Authorisation failed - no certificates found for issuer', params: { iss, kid } });
                            throw new Error('AuthFailed');
                        }

                        this.logger.info({ function: func, log: 'Validating against certKeys', });
                        const validTokenFound = _.find(certKeys, (cert) => {
                            try {
                                return jwt.verify(token, cert) !== null;
                            } catch (e) {
                                this.logger.warn({ function: func, log: 'verify failed', params: { kid, error: e.message } });
                                return false;
                            }
                        });

                        if (!validTokenFound) {
                            this.logger.error({ function: func, log: 'Authorisation failed for token', params: { iss } });
                            throw new Error('AuthFailed');
                        }

                        this.logger.info({ function: func, log: 'filtering claim' });
                        const filteredClaims = _.omit(claims, RegisteredClaims);

                        this.logger.info({ function: func, log: 'token authorised' });
                        return { authorised: true, claims: filteredClaims, };
                    });
            })
            .catch((err) => {
                this.logger.warn({ function: func, log: `Error checking authorisation: ${err.message}` });
                throw err;
            });
    }
}

module.exports = Authenticate;
