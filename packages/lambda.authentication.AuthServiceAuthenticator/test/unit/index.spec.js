const { ErrorSpecs } = require('internal-handler');
const JwtAuth = require('../../lib/index');
const keys = require('../../lib/params');
const should = require('should');
const sinon = require('sinon');
const Promise = require('bluebird');
const _ = require('underscore');

const { ParameterStoreStaticLoader } = require('internal-parameterstore-static-loader');
const DB = require('internal-services-db');
const { StatusCodeError } = require('internal-status-code-error');
const ParameterService = require('internal-parameter-service');

describe('jwt-authenticator.handler', function() {
    let sandbox;
    let config, context, event, callback;

    const username = 'user';
    const password = 'pass';
    const replicaSet = 'replica';
    const domain = 'domain';

    const env = 'local';
    const region = 'eu-west-1';

    const errFunc = () => {
        throw new Error('should be stubbed')
    };
    const dummyLoader = {load: errFunc};
    const dummyParamService = {
        setParameter: errFunc,
        getParameters: errFunc
    };
    const db = {connect: errFunc, disconnect: errFunc};

    before(() => {
        sandbox = sinon.createSandbox();
    });



    afterEach(() => {
        sandbox.restore();
    });

    describe('jwt-Authenticator.handler', function () {

        beforeEach(() => {
            context = { context: 'context', logGroupName: 'logGroupName'};
            event = { AWS_REGION: region, env };
            callback = () => {
            };

            config = {
                'defaultMongo.username': username,
                'defaultMongo.password': password,
                'defaultMongo.replicaSet': replicaSet,
                domain
            };
        });


        it('should call param-store static loader', (done) => {
            sandbox.stub(dummyLoader, 'load').resolves(config);
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);

            JwtAuth.run(event, context, () => {
                try {
                    const paramPrefix = '/local/';
                    const region = 'eu-west-1';

                    should(ParameterStoreStaticLoader.Create.callCount).eql(1);
                    should(ParameterStoreStaticLoader.Create.calledWithExactly(
                        {keys, paramPrefix, env: {region}}
                    )).eql(true);


                    should(dummyLoader.load.callCount).eql(1);
                    should(dummyLoader.load.calledWith(
                        {}
                    )).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });

        it('should default env and region to test values', (done) => {
            sandbox.stub(dummyLoader, 'load').resolves(config);
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(process, 'env').value(_.omit(process.env, ['Environment', 'AWS_REGION']));

            JwtAuth.run({}, context, () => {
            })
                .then(() => {
                    const paramPrefix = '/test/';
                    const region = 'local';

                    should(ParameterStoreStaticLoader.Create.callCount).eql(1);
                    should(ParameterStoreStaticLoader.Create.calledWithExactly(
                        {keys, paramPrefix, env: {region}}
                    )).eql(true);


                    should(dummyLoader.load.callCount).eql(1);
                    should(dummyLoader.load.calledWith(
                        {}
                    )).eql(true);

                    done();
                })
                .catch((err) => done(err instanceof Error ? err : new Error(err)));
        });
    });

    describe('jwt-authenticator.run', function () {


    });

});
