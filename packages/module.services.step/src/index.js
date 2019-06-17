'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');
const uuid = require('uuid');
const _ = require('underscore');

class Step {
    constructor({ region, step }) {
        this._step = step || new AWS.StepFunctions({ region });
    }

    start(...args) {
        return startImpl(this, ...args);
    }

    describe(...args) {
        return describeImpl(this, ...args);
    }

    stop(...args) {
        return stopImpl(this, ...args);
    }

    static Create(...args) {
        return new Step(...args);
    }
}

const startImpl = Promise.method((self, { id: stateMachineArn, input, name = uuid.v4() }) => {
    const params = { stateMachineArn, input: _.isString(input) ? input : JSON.stringify(input), name };

    return self._step.startExecution(params).promise()
        .then((result) => (result.executionArn));
});

const describeImpl = Promise.method((self, { id: executionArn }) => {
    const params = { executionArn };

    return self._step.describeExecution(params).promise()
        .then((result) => ({ status: result.status, output: result.output, input: result.input }));
});

const stopImpl = Promise.method((self, { id: executionArn, cause, error }) => {
    const params = { executionArn, cause, error };

    return self._step.stopExecution(params).promise()
        .then((result) => (result));
});

module.exports = Step;
