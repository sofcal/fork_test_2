'use strict';

const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const _ = require('underscore');

class JwtIssuer {
    constructor(cache, { iss, newCertDelay } = {}) {
        this._jwt = Promise.promisifyAll(jwt);

        this.cache = cache;
        this.newCertDelay = newCertDelay;
        this.iss = iss;

        this.validate();
    }

    validate() {
        if (!this.cache || !_.isFunction(this.cache.getData)) {
            throw new Error('invalid cache: expected object with getData function');
        }

        if (!this.iss || !_.isString(this.iss)) {
            throw new Error('invalid iss: expected string');
        }
        if (!this.newCertDelay || (!_.isNumber(this.newCertDelay) || _.isNaN(this.newCertDelay))) {
            throw new Error('invalid newCertDelay: expected number of seconds');
        }
    }

    generate({ claims, expiresIn, algorithm }) {
        // return cache.get()
        return this.cache.getData()
            .then((cached) => {
                const certWrap = getUsableCert(cached, this.newCertDelay);

                const defaultClaims = {
                    kid: certWrap.kid,
                    iss: this.iss
                };

                const privateKey = certWrap.private;

                const jwtClaims = Object.assign({ }, claims, defaultClaims);

                return this._jwt.signAsync(jwtClaims, privateKey, { algorithm, expiresIn });
            });
    }
}

const getUsableCert = (cached, newCertDelay) => {
    const nowS = Math.ceil(Date.now() / 1000);

    if (cached[0] && (nowS > (cached[0].timestamp + newCertDelay))) {
        return cached[0];
    }

    return cached[1];
};

JwtIssuer.Algortithms = { RS256: 'RS256' };

module.exports = JwtIssuer;
