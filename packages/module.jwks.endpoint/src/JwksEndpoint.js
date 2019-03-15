'use strict';

const crypto = require('crypto');
const JwksCache = require('./JwksCache');
const Promise = require('bluebird');
const {RequestLogger} = require('@sage/bc-request-logger');

const keyType = 'RSA';
const keyUse = 'sig';
const algorithm = 'RS256';
const DEFAULT_CACHE_TTL = 600;

class JwksEndpoint {
    constructor(config, parameterStore) { // TODO: rewrite me
        this.className = 'JwksEndpoint';
        this.logger = RequestLogger.Create({ service: 'JwksEndpoint' });
        const env = process.env.Environment;
        const cacheExpiry = config.cacheExpiry || DEFAULT_CACHE_TTL;

        this.paramPrefix = `/${env}/`;
        this.primaryKeyName = `${this.paramPrefix}accessToken.primary.publicKey`;
        this.secondaryKeyName = `${this.paramPrefix}accessToken.secondary.publicKey`;
        this.salt = process.env.salt;

        this.tokenCache = new JwksCache({ endpoint: 'TODO', cacheExpiry: cacheExpiry }, this.logger, parameterStore); // TODO: create it somewhere else
    }

    getJwks(...args) {
        return getJwksImpl(this, ...args);
    }
}

const getJwksImpl = Promise.method((self, req, res) => {
    const func = `${self.className}.onGetJwksImpl`;
    self.logger.info({ function: func, msg: 'started' });

    return self.tokenCache.getParams().then(params => {
        return checkKeys(self, params);
    }).then(keys => {
        const response = makeResponse(self, keys);
        return res.send(200, response);
    }).catch(err => {
        self.logger.error({ function: func, msg: 'Failed to get jwks.', err: err });
        return res.send(500, err);
    }).then((data) => {
        self.logger.info({ function: func, msg: 'ended' });
        return data;
    });
});

function checkKeys(self, params) {
    const func = 'checkKeys';
    const primary = params[self.primaryKeyName];
    const secondary = params[self.secondaryKeyName];

    if (!primary) {
        self.logger.error({ function: func, msg: 'primary key not found', keyName: self.primaryKeyName });
        throw new Error('Failed to retrieve primary key');
    }
    if (!secondary) {
        self.logger.error({ function: func, msg: 'secondary key not found', keyName: self.secondaryKeyName });
        throw new Error('Failed to retrieve secondary key');
    }
    return { primary, secondary };
}

function makeResponse(self, keys) {
    const primaryDer = convertPemToDer(keys.primary);
    const secondaryDer = convertPemToDer(keys.secondary);

    const primaryKeyId = getHash(primaryDer, self.salt);
    const secondaryKeyId = getHash(secondaryDer, self.salt);

    // "x5c" is the DER of the key, "kid" is a hash of this
    const response = {
        keys: [
            {
                kty: keyType,
                alg: algorithm,
                use: keyUse,
                kid: primaryKeyId,
                x5c: [primaryDer] },

            {
                kty: keyType,
                alg: algorithm,
                use: keyUse,
                kid: secondaryKeyId,
                x5c: [secondaryDer] }] };

    return response;
}

// TODO: refactor me -----------------------------------------------------------

function getHash(data, salt = 'DefaultSaltMustBeRewritten') {
    return crypto.createHash('sha256').update(data + salt).digest('hex');
}

function convertPemToDer(pem) {
    return pem.replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
        .replace(/-----END RSA PUBLIC KEY-----/g, '')
        .replace(/\\n/g, '')
        .replace(/\\\\n/g, '')
        .replace(/\s/g, '')
        .trim();
}

// =============================================================================


/*
function getParamStore() {
    const {
        Environment: env = 'test',
        AWS_REGION: region = 'local'
    } = process.env;

    const paramPrefix = `/${env}/`;
    return ParameterService.Create({env: {region}, paramPrefix});
}
*/

module.exports = JwksEndpoint;