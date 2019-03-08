/* eslint-disable no-console */

'use strict';

const needle = require('needle');

// set default user agent
needle.defaults({
    user_agent: 'BankDrive'
});

// Cache of certificates for an endpoint
class JWKSCache {
    constructor(endPoint, delay, logger) {
        this.endPoint = endPoint;
        this.delay = delay;
        this.logger = logger;

        this.func = 'JWKSCache.impl';

        this.certList = {};
    }

    // check last refresh time hasn't passed expiry point
    cacheExpired() {
        return Math.floor(Date.now() / 1000) > (this._refreshTime + this.delay);
    }

    // Empty existing cache, then call JWKS endpoint to get new keylist
    buildCache() {
        return Promise.resolve()
            // empty old cache
            .then(() => {
                this.certList = {};
            })
            // call endpoint
            .then(() => this.fetchEndPoint())
            // extract key id
            .then((res) => {
                const { keys } = res.body;
                keys.forEach(({ kid, x5c }) => {
                    this.certList[kid] = x5c;
                });

                this._refreshTime = Math.floor(Date.now() / 1000);
            })
            .catch((err) => {
                this.logger.error({ function: this.func, log: `Error building cache: ${err}` });
                throw err;
            });
    }

    // get Cert lists
    getCerts() {
        return Promise.resolve()
            // check if cache needs to be refreshed
            .then(() => {
                if (this.cacheExpired()) {
                    this.logger.info({ function: this.func, log: `endpoint ${this.endPoint} cache expired, refreshing` });
                    return this.buildCache();
                }
                return undefined;
            })
            // return all keys/certlists
            .then(() => this.certList);
    }

    // fetch endpoint
    fetchEndPoint() {
        this.logger.info({ function: this.func, log: `Fetching data from endpoint ${this.endPoint}` });
        return Promise.resolve()
            .then(() => needle('get', this.endPoint))
            .catch((err) => {
                console.log(`alert: ${err}`);
                throw new Error(`Fetch endpoint error: ${err.message}`);
            });
    }
}

module.exports = {
    JWKSCache
};
