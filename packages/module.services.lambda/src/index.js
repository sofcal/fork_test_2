'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');

class Lambda {
    constructor({ region, lambda }) {
        this._lambda = lambda || new AWS.Lambda({ region });
    }

    invoke(...args) {
        return invokeImpl(this, ...args);
    }

    static Create(...args) {
        return new Lambda(...args);
    }
}

const invokeImpl = Promise.method((self, { functionName: FunctionName, payload: Payload }) => {
    const params = { FunctionName, InvocationType: 'RequestResponse', LogType: 'Tail', Payload };
    return self._lambda.invoke(params).promise()
        .then((result) => result.Payload);
});

module.exports = Lambda;
