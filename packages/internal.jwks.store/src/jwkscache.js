'use strict';

const NodeCache = require('node-cache');

class JWKSCache {
    constructor(endPoint, delay) {
        this.endPoint = endPoint;
        this.delay = delay;

        // structure:
        //    serviceID:
        //       cachelist: Array
        //       refreshTime: Number
        //       refreshList: Array

        this.keyList = new NodeCache();
        this.refreshTime = Date.now() / 1000;
        this.buildCache();
    }

    cacheExpired() {
        return (this.refreshTime + this.delay) > (Date.now() / 1000);
    }

    buildCache() {
        // empty old cache
        this.keyList.flushAll();

        // fetch endPoint
        const keys = [
            {
                alg: 'RS256',
                kty: 'RSA',
                use: 'sig',
                kid: 'c67dd34cc58bcb792e82cf2be187b5035c3304c2e55928f64e10cc324d2f48fc',
                x5c: [
                    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAutnM13nFrrV+iLN20971SyU2nrGgWoyv5iLtBQQfMbNSdLWlmSdTzUSJNxJ5SZQhdlCQGowPus'
                ]
            },
            {
                alg: 'RS256',
                kty: 'RSA',
                use: 'sig',
                kid: 'e7f1a2337fcb7320f7f28329069859b8450256d5e9484ba8c2575f5270389d7f',
                x5c: [
                    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAs0YkX2z1DQ99dkVMfZxrKVuubQdif6Q3oY9DzywL4kPjXp2IPTEEuYSHjXgih0nG'
                ]
            }
        ];

        keys.forEach(({ kid, x5c }) =>
            this.keyList.set(kid, x5c, this.delay));

        this.refreshTime = Date.now() / 1000;
    }

    getCerts() {
        if (this.cacheExpired()) {
            this.buildCache();
        }

        const keys = this.keyList.keys();

        return this.keyList.mget(keys);
    }
}

module.exports = {
    JWKSCache
};
