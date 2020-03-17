'use strict';

const Promise = require('bluebird');

class KMS {
    constructor({ region = 'us-east-1' }) {
        this.region = region;
    }

    decryptAsync(...args) {
        return decryptAsyncImpl(this, ...args);
    }
}

const decryptAsyncImpl = Promise.method((self, options) => {
    return { Plaintext: options.CiphertextBlob };
});

module.exports = KMS;
