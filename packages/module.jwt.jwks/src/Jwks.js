'use strict';

const { Kid } = require('@sage/sfab-s2s-jwt-kid');

const kty = 'RSA'; // keyType
const use = 'sig'; // use
const alg = 'RS256'; // algorithm

class Jwks {
    static Generate(key) {
        const x5c = convertPemToDer(key);
        const kid = Kid.Generate(x5c);

        return { kty, alg, use, kid, x5c };
    }
}

function convertPemToDer(pem) {
    return pem.replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
        .replace(/-----END RSA PUBLIC KEY-----/g, '')
        .replace(/\\n/g, '')
        .replace(/\\\\n/g, '')
        .replace(/\s/g, '')
        .trim();
}

module.exports = Jwks;
