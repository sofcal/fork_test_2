'use strict';

const { Kid } = require('@sage/sfab-s2s-jwt-kid');

const _ = require('underscore');

const kty = 'RSA'; // keyType
const use = 'sig'; // use
const alg = 'RS256'; // algorithm

class Jwks {
    static Generate(publicKey, keyToUseForKid, isOpenSSL = false) {
        const x5cPublic = Jwks.ConvertPemToX5C(publicKey, isOpenSSL);
        const kid = Kid.Generate(keyToUseForKid);

        return { kty, alg, use, kid, x5c: [x5cPublic] };
    }

    static ConvertPemToX5C(pem, isOpenSSL = false) {
        const trimmed = pem.replace(/-----[^-]*?-----/g, '')
            .replace(/\\n/g, '')
            .replace(/\\\\n/g, '')
            .replace(/\s/g, '')
            .trim();

        if (!isOpenSSL) {
            return trimmed;
        }

        // an openSSL pem is the same as an rsa pem with the exception of some additional information at the start
        // this info happens to be 32 base64 encoded characters. So we can just trim it;
        return trimmed.replace(/.{32}/, '');
    }

    static ConvertX5CToPem(x5c) {
        // ensure the param is definitely in the x5c format before trying to convert
        let split = Jwks.ConvertPemToX5C(x5c).replace(/(.{64})/g, '$1\n');
        split = split.endsWith('\n') ? split : `${split}\n`;
        return `-----BEGIN RSA PUBLIC KEY-----\n${split}-----END RSA PUBLIC KEY-----`;
    }

    static isExpired(createdAt, maxAgeSeconds) {
        return (createdAt + maxAgeSeconds) < Math.floor(Date.now() / 1000);
    }

    static isValid(publicKey, keyToUseForKid, createdAt, maxAgeSeconds) {
        const isExpired = Jwks.isExpired(createdAt, maxAgeSeconds);
        return _.isString(keyToUseForKid) && _.isString(publicKey) && !isExpired;
    }
}

module.exports = Jwks;
