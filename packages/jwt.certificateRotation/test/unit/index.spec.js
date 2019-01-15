const { ErrorSpecs } = require('internal-handler');
const Jwt = require('../../lib/index');
const keys = require('../../lib/params');
const keyPair = require('../../lib/keyPair');
const should = require('should');
const sinon = require('sinon');
const Promise = require('bluebird');
const _ = require('underscore');

const { ParameterStoreStaticLoader } = require('internal-parameterstore-static-loader');
const DB = require('internal-services-db');
const { StatusCodeError } = require('internal-status-code-error');
const ParameterService = require('internal-parameter-service');

describe('jwt-certificate-rotation', function() {

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
        event = {AWS_REGION: region, env};
    });

    beforeEach(() => {
        context = {context: 'context', logGroupName: 'logGroupName'};
        sandbox.stub(process, 'env').value(_.extend(process.env, {Environment: env, AWS_REGION: region }));
        event = {AWS_REGION: region, env};
        callback = () => {
        };

        config = {
            'defaultMongo.username': username,
            'defaultMongo.password': password,
            'defaultMongo.replicaSet': replicaSet,
            domain
        };

        sandbox.stub(DB, 'Create').returns(db);
        sandbox.stub(db, 'connect').resolves();
        sandbox.stub(db, 'disconnect').resolves();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('jwt-certificate-rotation.handler', function () {
        it('should retrieve params from param-store', (done) => {
            sandbox.stub(dummyLoader, 'load').resolves(config);
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);

            // const expected = { value: 'result' };
            // sandbox.stub(Jwt, 'run').resolves(expected);

            Jwt.run(event, context, () => {
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

            // const expected = { value: 'result' };
            // sandbox.stub(Jwt, 'run').resolves(expected);

            Jwt.run({}, context, () => {
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

        it('should connect and disconnect from the db', (done) => {
            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });

                return params;
            }));
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(keyPair, 'createKeyPair').resolves();

            // const expected = { value: 'result' };
            // sandbox.stub(impl, 'run').resolves(expected);

            // we test this by calling the it as a promise, so we can ensure disconnect is called
            Jwt.run(event, context, () => {
            })
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

                    done();
                })
                .catch((err) => done(err instanceof Error ? err : new Error(err)))
        });

        it('should not attempt to disconnect from the db if the db was never created', (done) => {
            sandbox.stub(dummyLoader, 'load').rejects(new Error('params_error'));
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);

            // const expected = { value: 'result' };
            // sandbox.stub(impl, 'run').resolves(expected);

            // we test this by calling the it as a promise, so we can ensure disconnect is called
            Jwt.run(event, context, () => {
            })
                .then(() => {
                    should(DB.Create.callCount).eql(0);
                    should(db.connect.callCount).eql(0);
                    should(db.disconnect.callCount).eql(0);

                    done();
                })
                .catch((err) => done(err instanceof Error ? err : new Error(err)))
        });

        it('should call the callback with a default 500 if impl throws an unexpected error', (done) => {
            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(Promise, 'map').rejects();

            // const err = new Error('impl.run.error');
            // sandbox.stub(impl, 'run').rejects(err);

            Jwt.run(event, context, (first, second) => {
                try {
                    should(first).eql(null);

                    const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.internalServer], ErrorSpecs.internalServer.statusCode);
                    should(second).eql({
                        statusCode: 500,
                        body: JSON.stringify(expected.toDiagnoses())
                    });

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });

        it('should fail if any param store values are missing', function (done) {
            delete config['defaultMongo.password'];

            Jwt.run(event, context, (first, second) => {
                try {
                    should(first).eql(null);

                    const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.failedToRetrieveParameters], ErrorSpecs.failedToRetrieveParameters.statusCode);
                    should(second).eql({
                        statusCode: 500,
                        body: JSON.stringify(expected.toDiagnoses())
                    });

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });

        it('should throw a StatusCodeError if event validation fails', function (done) {
            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(ParameterService, 'Create').returns(dummyParamService);

            delete(event.env);

            Jwt.run(event, context, (first, second) => {
                try {
                    should(first).eql(null);

                    should(second).eql({
                        statusCode: 500,
                        body: '{"$diagnoses":[{"$applicationCode":"InternalServerError","$message":"an error occurred while processing the request","$sdataCode":"ApplicationDiagnosis","$severity":"Error"}]}'
                    });

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });
    });

    describe('jwt-certificate-rotation.run', function () {
        let primaryKeysResponse;

        beforeEach(() => {
            context = {context: 'context', logGroupName: 'logGroupName'};
            sandbox.stub(process, 'env').value(_.extend(process.env, {Environment: env, AWS_REGION: region}));
            event = {AWS_REGION: region, env};
            callback = () => {
            };

            config = {
                'defaultMongo.username': username,
                'defaultMongo.password': password,
                'defaultMongo.replicaSet': replicaSet,
                domain
            };

            primaryKeysResponse = {
                '/local/accessToken.primary.publicKey': 'aaa',
                '/local/accessToken.primary.privateKey': 'bbb'
            };
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should fetch the primary crypto keys from param store', (done) => {
            const primaryKeysResponse = {
                '/local/accessToken.primary.publicKey': 'aaa',
                '/local/accessToken.primary.privateKey': 'bbb'
            };

            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(dummyParamService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(dummyParamService, 'setParameter').rejects();
            sandbox.stub(ParameterService, 'Create').returns(dummyParamService);

            Jwt.run(event, context, () => {
            })
                .then(() => {
                    should(dummyLoader.load.callCount).eql(1);
                    should(ParameterService.Create.callCount).eql(1);
                    should(dummyParamService.getParameters.callCount).eql(2);

                    done();
                })
                .catch((err) => {
                    done(err instanceof Error ? err : new Error(err));
                })
        });

        it('should generate identical primary and secondary keys if primary keys do not exist', (done) => {
            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(dummyParamService, 'getParameters').resolves({
                '/local/accessToken.primary.publicKey': 'aaa'
            });
            sandbox.stub(dummyParamService, 'setParameter').resolves();
            sandbox.stub(ParameterService, 'Create').returns(dummyParamService);

            Jwt.run(event, context, (first, second) => {
                try {
                    should(first).eql(null);

                    const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.internalServer], ErrorSpecs.internalServer.statusCode);
                    should(second).eql({
                        statusCode: 500,
                        body: JSON.stringify(expected.toDiagnoses())
                    });

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });

        it('should copy primary keys to secondary keys if primary keys already exist', (done) => {
            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(dummyParamService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(dummyParamService, 'setParameter').resolves();
            sandbox.stub(ParameterService, 'Create').returns(dummyParamService);
            sandbox.stub(keyPair, 'createKeyPair').rejects();

            Jwt.run(event, context, () => {
            })
                .then(() => {
                    should(dummyLoader.load.callCount).eql(1);
                    should(ParameterService.Create.callCount).eql(1);
                    should(dummyParamService.setParameter.callCount).eql(2);
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

                    done();
                })
                .catch((err) => {
                    done(err instanceof Error ? err : new Error(err));
                })
        });

        it('should throw an error if copying to secondary fails', (done) => {

            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(dummyParamService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(dummyParamService, 'setParameter').rejects();
            sandbox.stub(ParameterService, 'Create').returns(dummyParamService);
            callback = sandbox.spy();

            Jwt.run(event, context, (first, second) => {
                try {
                    should(first).eql(null);
                    const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.internalServer], ErrorSpecs.internalServer.statusCode);
                    should(second).eql({
                        statusCode: 500,
                        body: JSON.stringify(expected.toDiagnoses())
                    });
                    done();
                }
                catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            })
        });

        it('should generate a new AES public/private key pair', function(done) {
            this.timeout(5000);
            const primaryKeysResponse = {
                '/local/accessToken.primary.publicKey': 'aaa',
                '/local/accessToken.primary.privateKey': 'bbb'
            };
            const keyLength = 256;

            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(dummyParamService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(dummyParamService, 'setParameter').resolves();
            sandbox.stub(ParameterService, 'Create').returns(dummyParamService);
            sandbox.spy(keyPair, 'createKeyPair');

            Jwt.run(event, context, () => {
            })
                .then(() => {
                    should(keyPair.createKeyPair.callCount).eql(1);
                    should(keyPair.createKeyPair.calledWithExactly(keyLength)).eql(true);
                    done();
                })
                .catch((err) => {
                    done(err instanceof Error ? err : new Error(err));
                });
        });

        it('should overwrite primary keys with new crypto pair', (done) => {
            const primaryKeysResponse = {
                '/local/accessToken.primary.publicKey': 'aaa',
                '/local/accessToken.primary.privateKey': 'bbb'
            };

            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(dummyParamService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(dummyParamService, 'setParameter').resolves();
            sandbox.stub(ParameterService, 'Create').returns(dummyParamService);
            sandbox.stub(keyPair, 'createKeyPair').resolves({
                public: 'publicKey',
                private: 'privateKey'
            });

            Jwt.run(event, context, () => {
            })
                .then(() => {
                    should(keyPair.createKeyPair.callCount).eql(1);
                    should(dummyParamService.setParameter.callCount).eql(4); //twice for secondary, twice again for primary
                    should(dummyParamService.setParameter.getCall(2).args[0]).eql({
                        name: `/local/accessToken.primary.publicKey`,
                        type: 'SecureString',
                        value: 'publicKey',
                        overwrite: true
                    });
                    should(dummyParamService.setParameter.getCall(3).args[0]).eql({
                        name: `/local/accessToken.primary.privateKey`,
                        type: 'SecureString',
                        value: 'privateKey',
                        overwrite: true
                    });
                    done();
                })
                .catch((err) => {
                    done(err instanceof Error ? err : new Error(err));
                });
        });

        it('should throw an error if saving primary keys fails', (done) => {
            sandbox.stub(dummyLoader, 'load').callsFake(Promise.method((params) => {
                _.each(_.keys(config), (key) => {
                    params[key] = config[key];
                });
                return params;
            }));
            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
            sandbox.stub(dummyParamService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(dummyParamService, 'setParameter').onCall(0).onCall(1).rejects('Failed to save primary keys to param store');
            sandbox.stub(ParameterService, 'Create').returns(dummyParamService);
            sandbox.stub(keyPair, 'createKeyPair').resolves({ public: 'newPublicKey', private: 'newPrivateKey' });
            callback = sandbox.spy();

            Jwt.run(event, context, (first, second) => {
                try {
                    should(first).eql(null);
                    const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.internalServer], ErrorSpecs.internalServer.statusCode);
                    should(second).eql({
                        statusCode: 500,
                        body: JSON.stringify(expected.toDiagnoses())
                    });
                    done();
                }
                catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            })
        });
    });
});
