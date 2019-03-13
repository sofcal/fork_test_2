'use strict';

const Promise = require('bluebird');
const jwt = require('jsonwebtoken');

class JWTIssuer {
    constructor(cache) {
        this._jwt = Promise.promisifyAll(jwt);

        this.cache = cache;
    }

    generate({ claims, expiresIn, algorithm }) {
        // return cache.get()
        const cached = [{
            // some info
        }];

        const defaultClaims = {
            kid: cached[0].kid
        };

        const privateKey = cached[0].key;

        const jwtClaims = Object.assign({ }, claims, defaultClaims);

        return this._jwt.signAsync(jwtClaims, privateKey, { algorithm, expiresIn });
    }
}

JWTIssuer.Algortithms = { RS256: 'RS256' };
