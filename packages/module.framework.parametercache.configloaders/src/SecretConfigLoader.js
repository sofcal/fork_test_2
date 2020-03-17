'use strict';

const Promise = require('bluebird');

const AWS = require('aws-sdk');
const fs = Promise.promisifyAll(require('fs'));

class SecretConfigLoader {
    constructor({ path, configPropertyName = '__config', overridesPropertyName = '__overrides', env: { region = 'us-east-1', signatureVersion } = {}, kms }) {
        this.kms = kms || Promise.promisifyAll(new AWS.KMS({ signatureVersion, region }));

        this.path = path;
        this.configPropertyName = configPropertyName;
        this.overridesPropertyName = overridesPropertyName;
    }

    load(params) {
        return loadImpl(this, params);
    }
}

const loadImpl = Promise.method((self, params) => {
    const { configPropertyName, overridesPropertyName, path } = self;

    const invalidProperty = !path || !configPropertyName || !overridesPropertyName;
    const invalidParams = !params[configPropertyName];

    if (invalidProperty) {
        const pathMessage = !path ? `path: ${path}; ` : '';
        const configPropertyMessage = !configPropertyName ? `configPropertyName: ${configPropertyName}; ` : '';
        const overridesPropertyMessage = !overridesPropertyName ? `overridesPropertyName: ${overridesPropertyName}` : '';

        throw new Error(`[SecretConfigLoader] invalid property - ${pathMessage}${configPropertyMessage}${overridesPropertyMessage}`);
    } else if (invalidParams) {
        const configParamsMessage = !params[configPropertyName] ? `params[${configPropertyName}]: ${params[configPropertyName]}` : '';
        throw new Error(`[SecretConfigLoader] invalid params - ${configParamsMessage}`);
    }

    return fs.readFileAsync(path)
        .then((buffer) => {
            const options = {
                CiphertextBlob: buffer
            };

            return self.kms.decryptAsync(options)
                .then((data) => {
                    params[overridesPropertyName] = data.Plaintext.toString(); // eslint-disable-line no-param-reassign
                });
        });
});

module.exports = SecretConfigLoader;
