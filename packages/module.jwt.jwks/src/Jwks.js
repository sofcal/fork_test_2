'use strict';

const { Kid } = require('@sage/sfab-s2s-jwt-kid');

const kty = 'RSA'; // keyType
const use = 'sig'; // use
const alg = 'RS256'; // algorithm

class Jwks {
    static Generate(publicKey, privateKey) {
        const x5cPublic = Jwks.ConvertPemToX5C(publicKey);
        const x5cPrivate = privateKey;
        const kid = Kid.Generate(x5cPrivate);

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

    static ConvertX5CToPem(x5c) {
        let split = x5c.replace(/(.{64})/g, '$1\n');
        split = split.endsWith('\n') ? split : `${split}\n`;
        return `-----BEGIN RSA PUBLIC KEY-----\n${split}-----END RSA PUBLIC KEY-----`;
    }
}

module.exports = Jwks;
