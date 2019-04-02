const { ErrorSpecs } = require('@sage/bc-default-lambda-handler');
const Jwt = require('../../lib/index');
const keys = require('../../lib/params');
const keyPair = require('../../lib/keyPair');
const should = require('should');
const sinon = require('sinon');
const Promise = require('bluebird');
const _ = require('underscore');

const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const DB = require('@sage/bc-services-db');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');
const ParameterService = require('@sage/bc-services-parameter');

describe.skip('lambda-jwt-certificaterotation', function() {

    let sandbox;
    let config, context, event, now;
    const TEST_DATE = 1552471130970;

    const username = 'user';
    const password = 'pass';
    const replicaSet = 'replica';
    const domain = 'domain';

    const env = 'local';
    const region = 'eu-west-1';

    const errFunc = () => {
        throw new Error('should be stubbed')
    };
    const dummyCloudWatchLogsPromise = {
        describeSubscriptionFilters: errFunc,
        putSubscriptionFilter: errFunc
    };
    const dummyLoader = {load: errFunc};
    const dummyParamService = {
        setParameter: errFunc,
        getParameters: errFunc
    };
    const db = {connect: errFunc, disconnect: errFunc};

    before(() => {
        sandbox = sinon.createSandbox();
        event = {AWS_REGION: region, env};
    });

    beforeEach(() => {
        context = {context: 'context',
            logGroupName: 'logGroupName',
            parameterstore: dummyParamService
        };
        sandbox.stub(process, 'env').value(_.extend(process.env, {Environment: env, AWS_REGION: region }));
        event = {AWS_REGION: region, env};

        config = {
            'defaultMongo.username': username,
            'defaultMongo.password': password,
            'defaultMongo.replicaSet': replicaSet,
            domain
        };

        sandbox.stub(DB, 'Create').returns(db);
        sandbox.stub(db, 'connect').resolves();
        sandbox.stub(db, 'disconnect').resolves();
        now = sinon.useFakeTimers(TEST_DATE);
    });

    afterEach(() => {
        now.restore();
        sandbox.restore();
    });

    describe('jwt-certificate-rotation.handler', function () {
        it('should retrieve params from param-store', () => {
            sandbox.stub(dummyLoader, 'load').resolves(config);
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);

            return Jwt.run(event, context, () => {
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
            });
        });

        it('should default env and region to test values', () => {
            sandbox.stub(dummyLoader, 'load').resolves(config);
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(process, 'env').value(_.omit(process.env, ['Environment', 'AWS_REGION']));

            return Jwt.run({}, context, () => {
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
                })
        });

        it('should connect and disconnect from the db', () => {
            sandbox.stub(dummyLoader, 'load').callsFake((params) => {
                console.log('_____IN LOADER');
                return Promise.resolve(undefined)
                    .then(() => {
                        _.each(_.keys(config), (key) => {
                            params[key] = config[key];
                        });

                        console.log(params);
                        return params;
                    });
            });
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(keyPair, 'createKeyPair').resolves();

            // we test this by calling the it as a promise, so we can ensure disconnect is called
            return Jwt.run(event, context, () => {})
                .then(() => {
                    should(DB.Create.callCount).eql(1);
                    should(DB.Create.calledWithExactly(
                        {env, region, domain, username, password, replicaSet, db: 'bank_db'}
                    )).eql(true);

                    should(db.connect.callCount).eql(1);
                    should(db.connect.calledWith(
                        'bank_db'
                    )).eql(true);

                    should(db.disconnect.callCount).eql(1);
                    should(db.disconnect.calledWith(
                    )).eql(true);

                })
        });

        it('should not attempt to disconnect from the db if the db was never created', () => {
            sandbox.stub(dummyLoader, 'load').rejects(new Error('params_error'));
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);

            // we test this by calling the it as a promise, so we can ensure disconnect is called
            return Jwt.run(event, context, () => {
            })
                .then(() => {
                    should(DB.Create.callCount).eql(0);
                    should(db.connect.callCount).eql(0);
                    should(db.disconnect.callCount).eql(0);

                })
        });

        it('should call the callback with a default 500 if impl throws an unexpected error', () => {
            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(Promise, 'map').rejects();

            return Jwt.run(event, context, (first, second) => {
                    should(first).eql(null);

                    const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.internalServer], ErrorSpecs.internalServer.statusCode);
                    should(second).eql({
                        statusCode: 500,
                        body: JSON.stringify(expected.toDiagnoses())
                    });
            });
        });

        it('should fail if any param store values are missing', function () {
            delete config['defaultMongo.password'];

            sandbox.stub(dummyLoader, 'load').resolves(config);
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);

            return Jwt.run(event, context, (first, second) => {
                    should(first).eql(null);

                    const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.failedToRetrieveParameters], ErrorSpecs.failedToRetrieveParameters.statusCode);
                    should(second).eql({
                        statusCode: 500,
                        body: JSON.stringify(expected.toDiagnoses())
                    });
            });
        });

        it('should throw a StatusCodeError if event validation fails', function () {
            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));

            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(ParameterService, 'Create').returns(dummyParamService);

            delete(event.env);

            return Jwt.run(event, context, (first, second) => {
                    should(first).eql(null);

                    should(second).eql({
                        statusCode: 500,
                        body: '{"$diagnoses":[{"$applicationCode":"InternalServerError","$message":"an error occurred while processing the request","$sdataCode":"ApplicationDiagnosis","$severity":"Error"}]}'
                    });
            });
        });
    });

    describe.skip('jwt-certificate-rotation.run', function () {
        let primaryKeysResponse;

        beforeEach(() => {
            sandbox.stub(process, 'env').value(_.extend(process.env, {Environment: env, AWS_REGION: region}));
            event = {AWS_REGION: region, env};

            config = {
                'defaultMongo.username': username,
                'defaultMongo.password': password,
                'defaultMongo.replicaSet': replicaSet,
                domain
            };

            primaryKeysResponse = {
                '/local/accessToken.primary.publicKey': 'aaa',
                '/local/accessToken.primary.privateKey': 'bbb',
                '/local/accessToken.primary.createdAt': TEST_DATE
            };
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should fetch the primary crypto keys from param store', () => {
            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));

            const testParams = { subscriptionFilters : '' };
            sandbox.stub(dummyCloudWatchLogsPromise, 'describeSubscriptionFilters').returns({ promise: () => Promise.resolve(testParams) });
            sandbox.stub(dummyCloudWatchLogsPromise, 'putSubscriptionFilter').callsFake(() => ({ promise: () => {} }));
            sandbox.stub(Promise, 'promisifyAll').withArgs().returns(dummyCloudWatchLogsPromise);

            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(dummyParamService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(dummyParamService, 'setParameter').rejects();
            sandbox.stub(ParameterService, 'Create').returns(dummyParamService);

            return Jwt.run(event, context, () => {
            })
                .then(() => {
                    should(dummyLoader.load.callCount).eql(1);
                    should(dummyParamService.getParameters.callCount).eql(3);
                })
        });

        it('should generate identical primary and secondary keys if primary keys do not exist', () => {
            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));

            sandbox.stub(keyPair, 'createKeyPair').resolves({
                public: 'publicKey',
                private: 'privateKey'
            });

            const testParams = { subscriptionFilters : '' };
            sandbox.stub(dummyCloudWatchLogsPromise, 'describeSubscriptionFiltersAsync').resolves(testParams);
            sandbox.stub(dummyCloudWatchLogsPromise, 'putSubscriptionFilterAsync').callsFake(() => {});
            sandbox.stub(Promise, 'promisifyAll').withArgs().returns(dummyCloudWatchLogsPromise);

            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);

            sandbox.stub(ParameterService, 'Create').returns(dummyParamService);
            sandbox.stub(dummyParamService, 'getParameters').resolves({
                '/local/accessToken.primary.publicKey': 'aaa'
            });
            sandbox.stub(dummyParamService, 'setParameter').resolves();

            return Jwt.run(event, context, (first, second) => {
                    should(first).eql(null);

                    const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.internalServer], ErrorSpecs.internalServer.statusCode);
                    should(second).eql({
                        statusCode: 500,
                        body: JSON.stringify(expected.toDiagnoses())
                    });
            });
        });

        it('should copy primary keys to secondary keys if primary keys already exist', () => {
            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));
            const testParams = { subscriptionFilters : '' };
            sandbox.stub(dummyCloudWatchLogsPromise, 'describeSubscriptionFiltersAsync').resolves(testParams);
            sandbox.stub(dummyCloudWatchLogsPromise, 'putSubscriptionFilterAsync').callsFake(() => {});
            sandbox.stub(Promise, 'promisifyAll').withArgs().returns(dummyCloudWatchLogsPromise);

            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(dummyParamService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(dummyParamService, 'setParameter').resolves();
            sandbox.stub(ParameterService, 'Create').returns(dummyParamService);
            sandbox.stub(keyPair, 'createKeyPair').rejects();

            return Jwt.run(event, context, () => {
            })
                .then(() => {
                    should(dummyLoader.load.callCount).eql(1);
                    should(dummyParamService.setParameter.callCount).eql(3);
                    const firstCallArgs = dummyParamService.setParameter.getCall(0).args[0];
                    should(firstCallArgs).eql({
                        name: '/local/accessToken.secondary.publicKey',
                        value: 'aaa',
                        type: 'SecureString',
                        overwrite: true
                    });
                    const secondCallArgs = dummyParamService.setParameter.getCall(1).args[0];
                    should(secondCallArgs).eql({
                        name: '/local/accessToken.secondary.privateKey',
                        value: 'bbb',
                        type: 'SecureString',
                        overwrite: true
                    });
                    const thirdCallArgs = dummyParamService.setParameter.getCall(2).args[0];
                    should(thirdCallArgs).eql({
                        name: `/local/accessToken.secondary.createdAt`,
                        type: 'SecureString',
                        value: TEST_DATE,
                        overwrite: true
                    });

                })
        });

        it('should throw an error if copying to secondary fails', () => { // TODO: check it

            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(dummyParamService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(dummyParamService, 'setParameter').rejects();

            return Jwt.run(event, context, (first, second) => {
                    should(first).eql(null);
                    const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.internalServer], ErrorSpecs.internalServer.statusCode);
                    should(second).eql({
                        statusCode: 500,
                        body: JSON.stringify(expected.toDiagnoses())
                    });
            })
        });

        it('should generate a new AES public/private key pair', function() {
            this.timeout(5000);

            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));
            const testParams = { subscriptionFilters : '' };
            sandbox.stub(dummyCloudWatchLogsPromise, 'describeSubscriptionFiltersAsync').resolves(testParams);
            sandbox.stub(dummyCloudWatchLogsPromise, 'putSubscriptionFilterAsync').callsFake(() => {});
            sandbox.stub(Promise, 'promisifyAll').withArgs().returns(dummyCloudWatchLogsPromise);

            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(ParameterService, 'Create').returns(dummyParamService);
            sandbox.stub(dummyParamService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(dummyParamService, 'setParameter').resolves();
            sandbox.spy(keyPair, 'createKeyPair');

            return Jwt.run(event, context, () => {
            })
                .then(() => {
                    should(keyPair.createKeyPair.callCount).eql(1);
                    should(keyPair.createKeyPair.calledWithExactly()).eql(true);
                })
        });

        it('should overwrite primary keys with new crypto pair', () => {
            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));
            const testParams = { subscriptionFilters : '' };
            sandbox.stub(dummyCloudWatchLogsPromise, 'describeSubscriptionFiltersAsync').resolves(testParams);
            sandbox.stub(dummyCloudWatchLogsPromise, 'putSubscriptionFilterAsync').callsFake(() => {});
            sandbox.stub(Promise, 'promisifyAll').withArgs().returns(dummyCloudWatchLogsPromise);

            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(ParameterService, 'Create').returns(dummyParamService);
            sandbox.stub(dummyParamService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(dummyParamService, 'setParameter').resolves();
            sandbox.stub(keyPair, 'createKeyPair').resolves({
                public: 'publicKey',
                private: 'privateKey'
            });

            return Jwt.run(event, context, () => {
            })
                .then(() => {
                    should(keyPair.createKeyPair.callCount).eql(1);
                    should(dummyParamService.setParameter.callCount).eql(6); //3x for secondary, 3x again for primary
                    should(dummyParamService.setParameter.getCall(3).args[0]).eql({
                        name: `/local/accessToken.primary.publicKey`,
                        type: 'SecureString',
                        value: 'publicKey',
                        overwrite: true
                    });
                    should(dummyParamService.setParameter.getCall(4).args[0]).eql({
                        name: `/local/accessToken.primary.privateKey`,
                        type: 'SecureString',
                        value: 'privateKey',
                        overwrite: true
                    });
                    should(dummyParamService.setParameter.getCall(5).args[0]).eql({
                        name: `/local/accessToken.primary.createdAt`,
                        type: 'SecureString',
                        value: TEST_DATE,
                        overwrite: true
                    });
                })
        });

        it('should throw an error if saving primary keys fails', () => {
            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(ParameterService, 'Create').returns(dummyParamService);
            sandbox.stub(dummyParamService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(dummyParamService, 'setParameter').onCall(0).onCall(1).rejects('Failed to save primary keys to param store');
            sandbox.stub(keyPair, 'createKeyPair').resolves({ public: 'newPublicKey', private: 'newPrivateKey' });

            return Jwt.run(event, context, (first, second) => {
                    should(first).eql(null);
                    const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.internalServer], ErrorSpecs.internalServer.statusCode);
                    should(second).eql({
                        statusCode: 500,
                        body: JSON.stringify(expected.toDiagnoses())
                    });
            })
        });
    });
});
