'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');

class ParameterService {
    constructor({ paramPrefix = null, env: { region } = {}, ssm }) {
        this.func = 'ParameterService.constructor';
        if (!region) {
            throw new Error('[ParameterStoreStaticLoader] invalid region');
        }
        this.ssm = ssm || new AWS.SSM({ region });
        this.paramPrefix = paramPrefix;
    }

    getParameters(params) {
        return getParametersImpl(this, params);
    }

    setParameter(...args) {
        return setParameterImpl(this, ...args);
    }

    static Create(...args) {
        return new ParameterService(...args);
    }
}

const getParametersImpl = Promise.method((self, params) => {
    const mapResponse = (response) => {
        const returnParams = {};
        // for loop used for performance reasons
        // eslint-disable-next-line no-restricted-syntax
        for (const p of response.Parameters) {
            const name = p.Name; // eslint-disable-next-line no-param-reassign
            returnParams[name] = p.Type === 'StringList' ? p.Value.split(',') : p.Value;
        }
        return returnParams;
    };

    const req = {
        Names: params,
        WithDecryption: true
    };

    return self.ssm.getParameters(req).promise()
        .then((response) => mapResponse(response));
});

const setParameterImpl = Promise.method((self, { name: Name, value: Value, type: Type, keyId: KeyId, overwrite: Overwrite = true }) => {
    const options = { Name, Type, Value, Overwrite, KeyId };

    return self.ssm.putParameter(options).promise()
        .then((data) => data);
});

module.exports = ParameterService;
