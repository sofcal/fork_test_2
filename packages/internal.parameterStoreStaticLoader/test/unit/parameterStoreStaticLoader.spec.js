'use strict';

const ParameterStoreStaticLoader = require('../../lib/ParameterStoreStaticLoader');
const aws = require('aws-sdk');

const sinon = require('sinon');
const should = require('should');

describe('internal.parameterStoreStaticLoader.ParameterStoreStaticLoader', function(){
    let sandbox;

    const errorFunc = () => { throw new Error('should be stubbed') };
    const ssm = { getParametersAsync: errorFunc };

    before(() => {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(() => {
        sandbox.stub(aws, 'SSM').returns(ssm);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should create an instance of ParameterStoreStaticLoader', () => {
            const options = { env: { region: 'mock' }};
            const loader = new ParameterStoreStaticLoader(options);

            should(loader).be.an.instanceof(ParameterStoreStaticLoader);
        });

        it('should assign properties', () => {
            const options = {paramPrefix: '/dev/', keys: ['one', 'two', 'three'], env: { region: 'mock' } };
            const loader = new ParameterStoreStaticLoader(options);

            should(loader.paramPrefix).eql('/dev/');
            should(loader.keys).eql(['one', 'two', 'three']);
            should(loader.ssm).eql(ssm);
        });

        it('should set paramPrefix to null if not provided', () => {
            const options = { keys: ['one', 'two', 'three'], env: { region: 'mock' } };
            const loader = new ParameterStoreStaticLoader(options);

            should(loader.paramPrefix).eql(null);
        });

        it('should set keys to null if not provided', () => {
            const options = { paramPrefix: '/dev/', env: { region: 'mock' } };
            const loader = new ParameterStoreStaticLoader(options);

            should(loader.keys).eql(null);
        });

        it('should throw if no region provided', () => {
            const options = {paramPrefix: '/dev/', keys: ['one', 'two', 'three'], env: { } };
            should(() => new ParameterStoreStaticLoader(options)).throw('[ParameterStoreStaticLoader] invalid region');
        });

        it('should create ssm with region supplied in options', () => {
            const options = {paramPrefix: '/dev/', keys: ['one', 'two', 'three'], env: { region: 'eu-west-1' } };
            new ParameterStoreStaticLoader(options);

            should(aws.SSM.calledWithExactly({ region: 'eu-west-1' })).eql(true);
            should(aws.SSM.calledWithNew()).eql(true);
        });
    });

    describe('load', () => {
        let loader;

        beforeEach(() => {
            const options = {paramPrefix: '/dev/', env: { region: 'eu-west-1' } };
            loader = new ParameterStoreStaticLoader(options);
        });

        it('should retrieve a single page of parameters from SSM', (done) => {
            const response = {
                Parameters: [
                    { Name: '/dev/one', Value: 'parameter_1' },
                    { Name: '/dev/two', Value: 'parameter_2' }
                ]
            };

            loader.keys = ['one', 'two'];
            sandbox.stub(ssm, 'getParametersAsync').resolves(response);

            const params = {};
            loader.load(params)
                .then(() => {
                    should(params).eql({
                        one: 'parameter_1',
                        two: 'parameter_2'
                    });

                    should(ssm.getParametersAsync.callCount).eql(1);
                    should(ssm.getParametersAsync.calledWithExactly(
                        { Names: ['/dev/one', '/dev/two'], WithDecryption: true }
                    )).eql(true);

                    done();
                })
                .catch((err) => done(err instanceof Error ? err : new Error(err)))
        });

        it('should retrieve multiple pages of parameters from SSM', (done) => {
            const response1 = {
                Parameters: [
                    { Name: '/dev/one', Value: 'parameter_1'},
                    { Name: '/dev/two', Value: 'parameter_2'}
                ]
            };

            const response2 = {
                Parameters: [
                    { Name: '/dev/three', Value: 'parameter_3'},
                    { Name: '/dev/four', Value: 'parameter_4'}
                ]
            };

            const response3 = {
                Parameters: [
                    { Name: '/dev/five', Value: 'parameter_5'},
                    { Name: '/dev/six', Value: 'parameter_6'}
                ]
            };

            sandbox.stub(ssm, 'getParametersAsync')
                .onCall(0).returns(Promise.resolve(response1))
                .onCall(1).returns(Promise.resolve(response2))
                .onCall(2).returns(Promise.resolve(response3));

            loader.keys = ['one', 'two', 'three', 'four', 'five', 'six'];

            // default max results is 10, which means keys would be broken into chunks of 10. To keep our test
            //  simple, we default this to 2 instead
            ParameterStoreStaticLoader.MaxResults = 2;

            const params = {};
            loader.load(params)
                .then(() => {
                    should(params).eql({
                        one: 'parameter_1',
                        two: 'parameter_2',
                        three: 'parameter_3',
                        four: 'parameter_4',
                        five: 'parameter_5',
                        six: 'parameter_6'
                    });

                    should(ssm.getParametersAsync.callCount).eql(3);
                    should(ssm.getParametersAsync.calledWithExactly(
                        { Names: ['/dev/one', '/dev/two'], WithDecryption: true }
                    )).eql(true);
                    should(ssm.getParametersAsync.calledWithExactly(
                        { Names: ['/dev/three', '/dev/four'], WithDecryption: true }
                    )).eql(true);
                    should(ssm.getParametersAsync.calledWithExactly(
                        { Names: ['/dev/five', '/dev/six'], WithDecryption: true }
                    )).eql(true);

                    done();
                })
                .catch((err) => done(err instanceof Error ? err : new Error(err)))
        });

        it('should not modify key names if no prefix is given', (done) => {

            const response = {
                Parameters: [
                    {Name: 'one', Value: 'parameter_1'},
                    {Name: '/dev/two', Value: 'parameter_2'}
                ]
            };

            loader.keys = ['one', '/dev/two'];
            sandbox.stub(ssm, 'getParametersAsync').returns(Promise.resolve(response));

            loader.paramPrefix = null;

            const params = {};
            loader.load(params)
                .then(() => {
                    should(params).eql({
                        'one': 'parameter_1',
                        '/dev/two': 'parameter_2'
                    });

                    should(ssm.getParametersAsync.callCount).eql(1);
                    console.log(ssm.getParametersAsync.getCall(0).args);
                    should(ssm.getParametersAsync.calledWithExactly(
                        { Names: ['one', '/dev/two'], WithDecryption: true }
                    )).eql(true);

                    done();
                })
                .catch((err) => done(err instanceof Error ? err : new Error(err)))
        });

        it('should throw if SSM throws', (done) => {
            const error = new Error('error from ssm');

            // this different syntax for stubbing is to get around a default logging message for unhandled promise rejections
            //  the message doesn't cause a problem, it's just dirty looking.
            //ssm.getParametersAsync = sandbox.spy(() => Promise.reject(error));
            sandbox.stub(ssm, 'getParametersAsync').callsFake(() => Promise.reject(error));
            loader.keys = ['one', 'two', 'three', 'four', 'five', 'six'];

            const params = {};
            loader.load(params)
                .then(() => done(new Error('should have thrown')))
                .catch((err) => {
                    should(err.message).eql('error from ssm');
                    done();
                })
                .catch((err) => done(err instanceof Error ? err : new Error(err)))
        });

        it('should throw if the keys is null', (done) => {

            loader.keys = null;
            sandbox.stub(ssm, 'getParametersAsync');

            const params = {};
            loader.load(params)
                .then(() => {
                    done(new Error('should have thrown'));
                })
                .catch((err) => {
                    should(err.message).eql('[ParameterStoreStaticLoader] keys object missing');
                    done()
                })
        });
    })
});