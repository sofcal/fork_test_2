'use strict';

const NodeCache = require('node-cache');
const needle = require('needle');

// set default user agent
needle.defaults({
    user_agent: 'BankDrive'
});

// Cache of certificates for an endpoint
class JWKSCache {
    constructor(endPoint = '', delay = 0) {
        this.endPoint = endPoint;
        this.delay = delay;

        this.certList = new NodeCache({ checkperiod: 60 });
        this.certList.on('del', () => this.closeCache());
    }

    // check last refresh time hasn't passed expiry point
    cacheExpired() {
        return (this.refreshTime + this.delay) > (Date.now() / 1000);
    }

    // Empty existing cache, then call JWKS endpoint to get new keylist
    buildCache() {
        return Promise.resolve()
            // empty old cache
            .then(() => {
                this.certList.flushAll();
            })
            // call endpoint
            .then(() => needle('get', this.endPoint))
            // extract key id
            .then((res) => {
                const { keys } = res.body;
                keys.forEach(({ kid, x5c }) =>
                    this.certList.set(kid, x5c, this.delay));

                this.refreshTime = Date.now() / 1000;
            });

        // fetch endPoint
        // const keys = [
        //     {
        //         alg: 'RS256',
        //         kty: 'RSA',
        //         use: 'sig',
        //         kid: 'c67dd34cc58bcb792e82cf2be187b5035c3304c2e55928f64e10cc324d2f48fc',
        //         x5c: [
        //             'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAutnM13nFrrV+iLN20971SyU2nrGgWoyv5iLtBQQfMbNSdLWlmSdTzUSJNxJ5SZQhdlCQGowPus'
        //         ]
        //     },
        //     {
        //         alg: 'RS256',
        //         kty: 'RSA',
        //         use: 'sig',
        //         kid: 'e7f1a2337fcb7320f7f28329069859b8450256d5e9484ba8c2575f5270389d7f',
        //         x5c: [
        //             'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAs0YkX2z1DQ99dkVMfZxrKVuubQdif6Q3oY9DzywL4kPjXp2IPTEEuYSHjXgih0nG'
        //         ]
        //     }
        // ];
    }

    // clear interval timeout to prevent memory leaks
    closeCache() {
        if (!this.certList.stats.keys) {
            this.certList.close();
        }
    }

    // get Cert lists
    getCerts() {
        Promise.resolve()
            // check if cache needs to be refreshed
            .then(() => {
                if (this.cacheExpired()) {
                    return this.buildCache();
                }
                return undefined;
            })
            // extract all keys
            .then(() => {
                const keys = this.certList.keys();

                return this.certList.mget(keys);
            });
    }
}

module.exports = {
    JWKSCache
};
