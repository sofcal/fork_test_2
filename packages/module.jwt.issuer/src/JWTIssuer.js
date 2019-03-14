'use strict';

const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const _ = require('underscore');

class JWTIssuer {
    constructor(cache) {
        this._jwt = Promise.promisifyAll(jwt);

        this.cache = cache;
        this.cache = { get };
    }

    generate({ claims, expiresIn, algorithm }) {
        // return cache.get()
        return this.cache.get()
            .then((cached) => {
                const certWrap = _.find(cached, (c) => c.status === 'primary');

                const defaultClaims = {
                    kid: certWrap.kid
                };

                const privateKey = cached[0].key;

                const jwtClaims = Object.assign({ }, claims, defaultClaims);

                return this._jwt.signAsync(jwtClaims, privateKey, { algorithm, expiresIn });
            });
    }
}

const get = () => {
    return [{
        status: 'primary',
        private: 'primary_private',
        public: 'primary_public',
        timestamp: 'primary_timestamp',
        kid: 'primary_kid'
    }, {
        status: 'secondary',
        private: 'secondary_private',
        public: 'secondary_public',
        timestamp: 'secondary_timestamp',
        kid: 'secondary_kid'
    }];
};

JWTIssuer.Algortithms = { RS256: 'RS256' };
