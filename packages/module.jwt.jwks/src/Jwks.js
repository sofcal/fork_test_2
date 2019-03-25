'use strict';

const { Kid } = require('@sage/sfab-s2s-jwt-kid');

const _ = require('underscore');

const kty = 'RSA'; // keyType
const use = 'sig'; // use
const alg = 'RS256'; // algorithm

class Jwks {
    static Generate(publicKey, privateKey) {
        const x5cPublic = Jwks.ConvertPemToX5C(publicKey);
        const kid = Kid.Generate(privateKey);

        return { kty, alg, use, kid, x5c: [x5cPublic] };
    }

    static ConvertPemToX5C(pem) {
        return pem.replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
            .replace(/-----END RSA PUBLIC KEY-----/g, '')
            .replace(/\\n/g, '')
            .replace(/\\\\n/g, '')
            .replace(/\s/g, '')
            .trim();
    }

    static ConvertX5CToPem(x5c, hack) {
        const type = hack ? 'PUBLIC KEY' : 'RSA PUBLIC KEY';
        let split = x5c.replace(/\n/g, '').replace(/\s/g, '').replace(/(.{64})/g, '$1\n');
        split = split.endsWith('\n') ? split : `${split}\n`;
        return `-----BEGIN ${type}-----\n${split}-----END ${type}-----`;
    }

    static isExpired(createdAt, maxAgeSeconds) {
        return (createdAt + maxAgeSeconds) < Math.floor(Date.now() / 1000);
    }

    static isValid(publicKey, privateKey, createdAt, maxAgeSeconds) {
        const isExpired = Jwks.isExpired(createdAt, maxAgeSeconds);
        return _.isString(privateKey) && _.isString(publicKey) && !isExpired;
    }
}

module.exports = Jwks;
