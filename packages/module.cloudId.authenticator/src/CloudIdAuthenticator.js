'use strict';

const jwt = require('jsonwebtoken');
const utils = require('./utils');
const _ = require('underscore');

const Promise = require('bluebird');

const noop = () => {};
const noopLogger = { error: noop, warn: noop, info: noop, };

const ClaimsToFilter = ['sub', 'exp', 'iat'];

class Authenticate {
    constructor(validIssuer, validAudiences, validClients, jwksClient, { logger = noopLogger } = {}) {
        this.issuer = validIssuer;
        this.audiences = validAudiences;
        this.clientIds = validClients;
        this.logger = logger;
        this.jwksClient = jwksClient;

        this.validate();
    }

    validate() {
        // validate this class instance
        if (!this.issuer) {
            throw new Error('Invalid argument passed: issuer');
        }
        if (!this.audiences) {
            throw new Error('Invalid argument passed: audiences');
        }
        if (!this.jwksClient) {
            throw new Error('Invalid argument passed: jwksClient');
        }
        if (!this.logger.info || !this.logger.error) {
            throw new Error('Invalid argument passed: Logger not valid');
        }
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
            utils.validateToken(decoded, this.issuer, this.audiences, this.clientIds);
        } catch (err) {
            this.logger.error({ function: func, log: 'Token failed validation', params: { error: err.message } });
            throw err;
        }

        return decoded;
    }

    getSigningKey = (kid) => {
        return new Promise((resolve, reject) => {
            this.jwksClient.getSigningKey(kid, (err, key) => {
                if (err) {
                    reject(err);
                }
                const signingKey = key.publicKey || key.rsaPublicKey;
                resolve(signingKey);
            });
        });
    };

    verifyToken = (token, signingKey) => {
        return new Promise((resolve, reject) => {
            jwt.verify(token, signingKey, {
                audience: this.audiences.split(','),
                issuer: this.issuer,
                algorithms: ['RS256']
            }, (err, decoded) => {
                if (err) {
                    reject(err);
                }
                resolve(decoded);
            });
        });
    };

    checkAuthorisation(token) {
        const func = `${Authenticate.name}.checkAuthorisation`;
        const iss = this.issuer;
        return Promise.resolve(undefined)
            .then(() => {
                // check the basics of the token which don't require certs
                return this.validateToken(token);
            })
            .then((decoded) => {
                const { kid } = decoded.header;
                this.logger.info({ function: func, log: 'Validating against certKeys', params: { iss } });
                return this.getSigningKey(kid)
                    .then((signingKey) => {
                        return this.verifyToken(token, signingKey)
                            .then(() => {
                                return { validTokenFound: true, claims: decoded.payload };
                            })
                            .catch(() => {
                                return { validTokenFound: false, claims: decoded.payload };
                            });
                    });
            })
            .then(({ validTokenFound, claims }) => {
                if (!validTokenFound) {
                    this.logger.error({ function: func, log: 'Authorisation failed for token', params: { iss } });
                    throw new Error('AuthFailed');
                }

                this.logger.info({ function: func, log: 'filtering claim' });
                const filteredClaims = _.omit(claims, ClaimsToFilter);

                this.logger.info({ function: func, log: 'token authorised' });
                return { authorised: true, claims: filteredClaims };
            })
            .catch((err) => {
                const e = err.message;
                this.logger.warn({ function: func, log: 'Error checking authorisation', params: { e } });
                throw err;
            });
    }
}

module.exports = Authenticate;
