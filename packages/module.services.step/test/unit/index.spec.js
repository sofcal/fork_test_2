const Step = require('../../lib/index');

const { error } = require('@sage/bc-debug-utils');

const AWS = require('aws-sdk');
const Promise = require('bluebird');
const should = require('should');
const sinon = require('sinon');

describe('@sage/bc-services-step.index', function(){
    let sandbox;
    const awsStepFunctions = { startExecution: error, describeExecution: error, stopExecution: error };

    before(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {
        sandbox.stub(AWS, 'StepFunctions').returns(awsStepFunctions);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should create an instance of Step', () => {
            const actual = new Step({ region: 'eu-west-1', step: { value: 'step' } });
            should(actual).be.an.instanceOf(Step);
        });

        it('should assign properties', () => {
            const actual = new Step({ region: 'eu-west-1', step: { value: 'step' } });
            should(actual._step).eql({ value: 'step' });

            should(AWS.StepFunctions.callCount).eql(0);
        });

        it('should create a new instance of AWS.StepFunctions if step is not passed in', () => {
            const actual = new Step({ region: 'eu-west-1'});
            should(actual._step).eql(awsStepFunctions);

            should(AWS.StepFunctions.callCount).eql(1);
            should(AWS.StepFunctions.calledWithNew()).eql(true);
        });
    });

    describe('Create', () => {
        it('should create an instance of Step', () => {
            const actual = Step.Create({ region: 'eu-west-1', step: { value: 'step' } });
            should(actual).be.an.instanceOf(Step);
        });

        it('should assign properties', () => {
            const actual = Step.Create({ region: 'eu-west-1', step: { value: 'step' } });
            should(actual._step).eql({ value: 'step' });

            should(AWS.StepFunctions.callCount).eql(0);
        });

        it('should create a new instance of AWS.StepFunctions if step is not passed in', () => {
            const actual = Step.Create({ region: 'eu-west-1'});
            should(actual._step).eql(awsStepFunctions);

            should(AWS.StepFunctions.callCount).eql(1);
            should(AWS.StepFunctions.calledWithNew()).eql(true);
        });
    });

    describe('start', () => {
        let uut;
        beforeEach(() => {
            uut = Step.Create({ region: 'eu-west-1'});
        });

        it('should return the execution ARN', () => {
            const ret = { executionArn: 'arn:execution:123' };
            sandbox.stub(awsStepFunctions, 'startExecution').returns({ promise: () => Promise.resolve(ret)});

            return uut.start({ id: 'arn:stateMachine:1', input: 'value', name: '123' })
                .then((actual) => {
                    should(actual).eql('arn:execution:123');
                });
        });

        it('should start the execution with the correct parameters', () => {
            const ret = { executionArn: 'arn:execution:123' };
            sandbox.stub(awsStepFunctions, 'startExecution').returns({ promise: () => Promise.resolve(ret)});

            return uut.start({ id: 'arn:stateMachine:1', input: 'value', name: '123' })
                .then(() => {
                    should(awsStepFunctions.startExecution.callCount).eql(1);
                    should(awsStepFunctions.startExecution.calledWithExactly(
                        { stateMachineArn: 'arn:stateMachine:1', input: 'value', name: '123' }
                    )).eql(true);
                });
        });

        it('should stringify the input if it is not already a string', () => {
            const ret = { executionArn: 'arn:execution:123' };
            sandbox.stub(awsStepFunctions, 'startExecution').returns({ promise: () => Promise.resolve(ret)});

            return uut.start({ id: 'arn:stateMachine:1', input: { key: 'value' }, name: '123' })
                .then(() => {
                    should(awsStepFunctions.startExecution.callCount).eql(1);
                    should(awsStepFunctions.startExecution.calledWithExactly(
                        { stateMachineArn: 'arn:stateMachine:1', input: '{"key":"value"}', name: '123' }
                    )).eql(true);
                });
        });
    });

    describe('describe', () => {
        let uut;
        beforeEach(() => {
            uut = Step.Create({ region: 'eu-west-1'});
        });

        it('should return the status, output and input', () => {
            const ret = { status: 'SUCCEEDED', output: '{"key":"output"}', input: '{"key":"input"}' };
            sandbox.stub(awsStepFunctions, 'describeExecution').returns({ promise: () => Promise.resolve(ret)});

            return uut.describe({ id: 'arn:execution:1', input: 'value', name: '123' })
                .then((actual) => {
                    should(actual).eql({
                        status: 'SUCCEEDED', output: '{"key":"output"}', input: '{"key":"input"}'
                    });
                });
        });

        it('should call describeExecution with the correct parameters', () => {
            const ret = { status: 'SUCCEEDED', output: '{"key":"output"}', input: '{"key":"input"}' };
            sandbox.stub(awsStepFunctions, 'describeExecution').returns({ promise: () => Promise.resolve(ret)});

            return uut.describe({ id: 'arn:execution:1', input: 'value', name: '123' })
                .then(() => {
                    should(awsStepFunctions.describeExecution.callCount).eql(1);
                    should(awsStepFunctions.describeExecution.calledWithExactly(
                        { executionArn: 'arn:execution:1' }
                    )).eql(true);
                });
        });
    });

    describe('stop', () => {
        let uut;
        beforeEach(() => {
            uut = Step.Create({ region: 'eu-west-1'});
        });

        it('should return full result', () => {
            const ret = { key: 'value' };
            sandbox.stub(awsStepFunctions, 'stopExecution').returns({ promise: () => Promise.resolve(ret)});

            return uut.stop({ id: 'arn:execution:1', cause: 'cause', error: 'error' })
                .then((actual) => {
                    should(actual).eql(ret);
                });
        });

        it('should call stopExecution with the correct parameters', () => {
            const ret = { key: 'value' };
            sandbox.stub(awsStepFunctions, 'stopExecution').returns({ promise: () => Promise.resolve(ret)});

            return uut.stop({ id: 'arn:execution:1', cause: 'cause', error: 'error' })
                .then(() => {
                    should(awsStepFunctions.stopExecution.callCount).eql(1);
                    should(awsStepFunctions.stopExecution.calledWithExactly(
                        { executionArn: 'arn:execution:1', cause: 'cause', error: 'error' }
                    )).eql(true);
                });
        });
    });
});