'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');

class Key {
    constructor({ region, signatureVersion }) {
        const kms = new AWS.KMS({
            //signatureVersion,
            region
        });
        this._kms = Promise.promisifyAll(kms);
    }

    generateDataKey(...args) {
        return generateDataKeyImpl(this, ...args);
    }

    decrypt(...args) {
        return decryptImpl(this, ...args);
    }
}

const decryptImpl = Promise.method((self, message) => {
    const params = {
        CiphertextBlob: message.payload
    };

    return self._kms.decryptAsync(params)
        .then((data) => data);
});

const generateDataKeyImpl = Promise.method((self, message) => {
    const params = {
        KeyId: message.keyId,
        KeySpec: message.keySpec
    };

    return self._kms.generateDataKeyAsync(params)
        .then((data) => data);
});

module.exports = Key;

