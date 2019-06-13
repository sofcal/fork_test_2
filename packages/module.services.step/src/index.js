'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');
const uuid = require('uuid');

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

    static Create(...args) {
        return new Step(...args);
    }
}

const startImpl = Promise.method((self, { id: stateMachineArn, input, name = uuid.v4() }, { logger }) => {
    console.log('Invoking step');
    // const pullParams = { FunctionName, InvocationType, LogType: 'None', Payload: JSON.stringify({ key1: 'value1' }) };
    const params = { stateMachineArn, input, name };

    return self._step.startExecution(params).promise()
        .then((result) => {
            console.log('____result');
            console.log(result);

            return result.executionArn;
        });
});

const describeImpl = Promise.method((self, { id: executionArn }, { logger }) => {
    console.log('Invoking describe', executionArn);
    const params = { executionArn };

    return self._step.describeExecution(params).promise()
        .then((result) => {
            console.log('____result');
            console.log(result);
        });
});

const stopImpl = Promise.method((self, { id: executionArn, cause, error }, { logger }) => {
    console.log('Invoking stop', executionArn);
    const params = { executionArn, cause, error };

    return self._step.stopExecution(params).promise()
        .then((result) => {
            console.log('____result');
            console.log(result);
        });
});

module.exports = Step;
