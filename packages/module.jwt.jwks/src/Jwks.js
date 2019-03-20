'use strict';

const { Kid } = require('@sage/sfab-s2s-jwt-kid');

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

    static ConvertX5CToPem(x5c) {
        let split = x5c.replace(/(.{64})/g, '$1\n');
        split = split.endsWith('\n') ? split : `${split}\n`;
        return `-----BEGIN RSA PUBLIC KEY-----\n${split}-----END RSA PUBLIC KEY-----`;
    }

    static validateKeyData(data) {
        const [primary, secondary] = data;

        if (!Jwks.isKeyFormat(primary) && !Jwks.isKeyFormat(secondary)) {
            throw new Error('No valid key');
        }
        return data;
    }

    static isKeyFormat(dataJson) {
        const availableKeys = ["kty", "alg", "use", "kid", "x5c"];

        let valid = true;

        return Object.keys(dataJson).reduce((accumulator, key) => accumulator && availableKeys.includes(key), valid);

    }

    static filterExpired(data) {
        const now = new Date().getTime();
        return data.filter( (k) => {
            return now < Number(k.createdAt) + (this.config.delay || 1000);
        });
    }

    /**
     * Creates a json object which only contains keys whiches allowed and has all the require attributes.
     * @param dataJson
     * @returns {*[]}
     */
    static getListOfValidPublicKeys(dataJson) {
        let validPublicKeys = [];

        const allowedPrefixes = ['accessToken.primary.', 'accessToken.secondary.'];
        const allowedAttributes = ['publicKey', 'privateKey', 'createdAt'];


        const hasAllAttributes = (prefix) => {
            let noAttributeMissing = true;
            return allowedAttributes.reduce((accumulator, a) => dataJson[prefix + a] && accumulator, noAttributeMissing);
        }

        const createPublicKey = (prefix) => {
            let temp = {};
            allowedAttributes.forEach((a) => {
                temp[a] = dataJson[prefix + a];
            });
            return temp;
        }

        validPublicKeys = allowedPrefixes
            .filter(p => hasAllAttributes(p))
            .map(p => createPublicKey(p));

        return validPublicKeys;
    }
}

module.exports = Jwks;
