'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');

class Key {
    constructor({ region, kms }) {
        this._kms = kms || new AWS.KMS({ region });
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

    return self._kms.decrypt(params).promise()
        .then((data) => data);
});

const generateDataKeyImpl = Promise.method((self, message) => {
    const params = {
        KeyId: message.keyId,
        KeySpec: message.keySpec
    };

    return self._kms.generateDataKey(params).promise()
        .then((data) => data);
});

module.exports = Key;

