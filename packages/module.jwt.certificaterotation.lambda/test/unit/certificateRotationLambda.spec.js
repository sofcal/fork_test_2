const CertificateRotationLambda = require('../../lib/CertificateRotationLambda');
const keyPairWrapper = require('../../lib/helpers/keyPairWrapper');
const ErrorSpecs = require('../../lib/ErrorSpecs');

const { Handler } = require('@sage/bc-independent-lambda-handler');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');
const { logger: loggerGen } = require('@sage/bc-debug-utils');
const ParameterService = require('@sage/bc-services-parameter');

const sinon = require('sinon');
const should = require('should');

describe('@sage/sfab-s2s-jwt-certificaterotation-lambda.CertificateRotationLambda', function() {
    const sandbox = sinon.createSandbox();
    const logger = loggerGen(true);
    let config;
    let event;

    beforeEach(() => {
        sandbox.useFakeTimers(1000);
        config = { Environment: 'test_environment', AWS_REGION: 'test_region', paramPrefix: '/test_prefix/' };
        event = { logger };
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should create an instance of CertificateRotationLambda', () => {
            const actual = new CertificateRotationLambda({ config });
            should(actual).be.an.instanceof(CertificateRotationLambda);
            should(actual).be.an.instanceof(Handler);
        });

        it('should assign properties', () => {
            const actual = new CertificateRotationLambda({ config });
            should(actual.cache).eql(null);
        });
    });

    describe('Create', () => {
        it('should create an instance of CertificateRotationLambda', () => {
            const actual = CertificateRotationLambda.Create({ config });
            should(actual).be.an.instanceof(CertificateRotationLambda);
        });
    });

    describe('validate', () => {
        it('should throw if there is no config', () => {
            const uut = new CertificateRotationLambda({ config });
            uut.config = null;

            should(
                () => uut.validate(event, { logger })
            ).throwError(StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidConfig], ErrorSpecs.invalidConfig.statusCode));
        });

        it('should throw if there is no event', () => {
            const uut = new CertificateRotationLambda({ config });

            should(
                () => uut.validate(null, { logger })
            ).throwError(StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent], ErrorSpecs.invalidEvent.statusCode));
        });
    });

    describe('init', () => {
        const parameterService = {};

        it('should create a parameter service', () => {
            const uut = new CertificateRotationLambda({ config });
            sandbox.stub(ParameterService, 'Create').returns(parameterService);

            return uut.init(event, { logger })
                .then(() => {
                    should(uut.services.parameter).eql(parameterService);

                    should(ParameterService.Create.callCount).eql(1);
                    should(ParameterService.Create.getCall(0).args).eql([
                        { env: { region: 'test_region' }, paramPrefix: '/test_prefix/' }
                    ]);
                    should(ParameterService.Create.calledWithExactly(
                        { env: { region: 'test_region' }, paramPrefix: '/test_prefix/' }
                    )).eql(true);
                });
        });

        it('should generate the paramPrefix from the environment if not provided', () => {
            delete config.paramPrefix;
            const uut = new CertificateRotationLambda({ config });
            sandbox.stub(ParameterService, 'Create').returns(parameterService);

            return uut.init(event, { logger })
                .then(() => {
                    should(uut.services.parameter).eql(parameterService);

                    should(ParameterService.Create.callCount).eql(1);
                    should(ParameterService.Create.calledWithExactly(
                        { env: { region: 'test_region' }, paramPrefix: '/test_environment/' }
                    )).eql(true);
                });
        });

        it('should return true to indicate runonce', () => {
            const uut = new CertificateRotationLambda({ config });
            sandbox.stub(ParameterService, 'Create').returns(parameterService);

            return uut.init(event, { logger })
                .then((runonce) => {
                    should(runonce).eql(true);
                });
        });
    });

    describe('impl', function () {
        let primaryKeysResponse;
        let uut;

        const errStub =  () => { throw new Error('should be stubbed'); };
        const parameterService = { getParameters: errStub, setParameter: errStub };

        beforeEach(() => {
            uut = new CertificateRotationLambda({ config });
            uut.services.parameter = parameterService;

            primaryKeysResponse = {
                'accessToken.primary.publicKey': 'primary_public',
                'accessToken.primary.privateKey': 'primary_private',
                'accessToken.primary.createdAt': '1'
            };
        });

        it('should fetch the existing primary keys from param store', () => {
            sandbox.stub(keyPairWrapper, 'keypair').returns({ private: 'generated_private', public: 'generated_public' });
            sandbox.stub(parameterService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(parameterService, 'setParameter').resolves();

            return uut.impl(event)
                .then(() => {
                    should(parameterService.getParameters.callCount).eql(1);
                    should(parameterService.getParameters.calledWithExactly(
                        [
                            'accessToken.primary.publicKey',
                            'accessToken.primary.privateKey',
                            'accessToken.primary.createdAt'
                        ]
                    )).eql(true);
                });
        });

        it('should generate identical primary and secondary keys if primary keys do not exist', () => {
            sandbox.stub(keyPairWrapper, 'keypair').returns({ private: 'generated_private', public: 'generated_public' });
            sandbox.stub(parameterService, 'getParameters').resolves([]);
            sandbox.stub(parameterService, 'setParameter').resolves();

            return uut.impl(event)
                .then(() => {
                    should(parameterService.setParameter.callCount).eql(6);
                    should(parameterService.setParameter.calledWith({
                        name: 'accessToken.primary.publicKey',
                        overwrite: true,
                        type: 'SecureString',
                        value: 'generated_public'
                    })).eql(true);
                    should(parameterService.setParameter.calledWith({
                        name: 'accessToken.primary.privateKey',
                        overwrite: true,
                        type: 'SecureString',
                        value: 'generated_private'
                    })).eql(true);
                    should(parameterService.setParameter.calledWith({
                        name: 'accessToken.primary.createdAt',
                        overwrite: true,
                        type: 'SecureString',
                        value: '1'
                    })).eql(true);

                    should(parameterService.setParameter.calledWith({
                        name: 'accessToken.secondary.publicKey',
                        overwrite: true,
                        type: 'SecureString',
                        value: 'generated_public'
                    })).eql(true);
                    should(parameterService.setParameter.calledWith({
                        name: 'accessToken.secondary.privateKey',
                        overwrite: true,
                        type: 'SecureString',
                        value: 'generated_private'
                    })).eql(true);
                    should(parameterService.setParameter.calledWith({
                        name: 'accessToken.secondary.createdAt',
                        overwrite: true,
                        type: 'SecureString',
                        value: '1'
                    })).eql(true);
                });
        });

        it('should copy primary keys to secondary keys if primary keys already exist', () => {
            sandbox.stub(keyPairWrapper, 'keypair').returns({ private: 'generated_private', public: 'generated_public' });
            sandbox.stub(parameterService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(parameterService, 'setParameter').resolves();

            return uut.impl(event)
                .then(() => {
                    should(parameterService.setParameter.callCount).eql(6);
                    should(parameterService.setParameter.calledWith({
                        name: 'accessToken.primary.publicKey',
                        overwrite: true,
                        type: 'SecureString',
                        value: 'generated_public'
                    })).eql(true);
                    should(parameterService.setParameter.calledWith({
                        name: 'accessToken.primary.privateKey',
                        overwrite: true,
                        type: 'SecureString',
                        value: 'generated_private'
                    })).eql(true);
                    should(parameterService.setParameter.calledWith({
                        name: 'accessToken.primary.createdAt',
                        overwrite: true,
                        type: 'SecureString',
                        value: '1'
                    })).eql(true);

                    should(parameterService.setParameter.calledWith({
                        name: 'accessToken.secondary.publicKey',
                        overwrite: true,
                        type: 'SecureString',
                        value: 'primary_public'
                    })).eql(true);
                    should(parameterService.setParameter.calledWith({
                        name: 'accessToken.secondary.privateKey',
                        overwrite: true,
                        type: 'SecureString',
                        value: 'primary_private'
                    })).eql(true);
                    should(parameterService.setParameter.calledWith({
                        name: 'accessToken.secondary.createdAt',
                        overwrite: true,
                        type: 'SecureString',
                        value: '1'
                    })).eql(true);
                });
        });

        it('should generate a new AES public/private key pair', () => {
            sandbox.stub(keyPairWrapper, 'keypair').returns({ private: 'generated_private', public: 'generated_public' });
            sandbox.stub(parameterService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(parameterService, 'setParameter').resolves();

            return uut.impl(event)
                .then(() => {
                    should(keyPairWrapper.keypair.callCount).eql(1);
                    should(keyPairWrapper.keypair.calledWithExactly(
                        // no params
                    )).eql(true);
                });
        });

        it('should throw an error if updating secondary fails', (done) => {
            const expected = new Error('update_secondary_error');

            sandbox.stub(keyPairWrapper, 'keypair').returns({ private: 'generated_private', public: 'generated_public' });
            sandbox.stub(parameterService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(parameterService, 'setParameter')
                .resolves()
                .withArgs({
                    name: 'accessToken.secondary.privateKey',
                    overwrite: true,
                    type: 'SecureString',
                    value: 'primary_private'
                }).rejects(expected);

            // using done callback, return statement deliberately missing
            uut.impl(event)
                .then(() => {
                    done(new Error('should have thrown'));
                })
                .catch((err) => {
                    should(err).eql(expected);
                    done();
                })
                .catch((err) => done(err instanceof Error ? err : new Error(err)))
        });

        it('should not update the primary if updating the secondary fails', (done) => {
            const expected = new Error('update_secondary_error');

            sandbox.stub(keyPairWrapper, 'keypair').returns({ private: 'generated_private', public: 'generated_public' });
            sandbox.stub(parameterService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(parameterService, 'setParameter')
                .resolves()
                .withArgs({
                    name: 'accessToken.secondary.privateKey',
                    overwrite: true,
                    type: 'SecureString',
                    value: 'primary_private'
                }).rejects(expected);

            // using done callback, return statement deliberately missing
            uut.impl(event)
                .then(() => {
                    done(new Error('should have thrown'));
                })
                .catch(() => {
                    should(parameterService.setParameter.callCount).be.lessThanOrEqual(3);

                    should(parameterService.setParameter.calledWith({
                        name: 'accessToken.primary.publicKey',
                        overwrite: sinon.match.bool,
                        type: 'SecureString',
                        value: sinon.match.string
                    })).eql(false);
                    should(parameterService.setParameter.calledWith({
                        name: 'accessToken.primary.privateKey',
                        overwrite: sinon.match.bool,
                        type: 'SecureString',
                        value: sinon.match.string
                    })).eql(false);
                    should(parameterService.setParameter.calledWith({
                        name: 'accessToken.primary.createdAt',
                        overwrite: sinon.match.bool,
                        type: 'SecureString',
                        value: sinon.match.number
                    })).eql(false);

                    done();
                })
                .catch((err) => done(err instanceof Error ? err : new Error(err)))
        });

        it('should throw an error if updating primary fails', (done) => {
            const expected = new Error('update_secondary_error');

            sandbox.stub(keyPairWrapper, 'keypair').returns({ private: 'generated_private', public: 'generated_public' });
            sandbox.stub(parameterService, 'getParameters').resolves(primaryKeysResponse);
            sandbox.stub(parameterService, 'setParameter')
                .resolves()
                .withArgs({
                    name: 'accessToken.primary.privateKey',
                    overwrite: sinon.match.bool,
                    type: 'SecureString',
                    value: sinon.match.string
                }).rejects(expected);

            // using done callback, return statement deliberately missing
            uut.impl(event)
                .then(() => {
                    done(new Error('should have thrown'));
                })
                .catch((err) => {
                    should(err).eql(expected);
                    done();
                })
                .catch((err) => done(err instanceof Error ? err : new Error(err)))
        });
    });
});
