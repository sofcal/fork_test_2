const Handler = require('../../lib/Handler');
const ErrorSpecs = require('../../lib/ErrorSpecs');
const { StatusCodeError } = require('@sage/bc-common-statuscodeerror');
const { CloudWatchSubscription } = require('@sage/bc-infrastructure-cloudwatchsubscription');
const { RequestLogger } = require('@sage/bc-requestlogger');
const { logger: loggerGen } = require('@sage/bc-debug-utils');

const should = require('should');
const sinon = require('sinon');

describe('@sage/bc-independent-lambda-handler.Handler', function(){
    class Derived extends Handler {
        constructor(config, serviceId) {
            super({ config, serviceId });
        }

        validate(...args) { return super.validate(...args); }
        init(...args) { return super.init(...args); }
        impl(...args) { return super.impl(...args); }
        buildResponse(...args) { return super.buildResponse(...args); }
        buildErrorResponse(...args) { return super.buildErrorResponse(...args); }
        dispose(...args) { return super.dispose(...args); }
    }

    const logger = loggerGen(true);

    const sandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should throw if Handler instantiated directly', () => {
            should(
                () => new Handler({})
            ).throwError(new Error('Handler should not be instantiated; extend Handler instead.'));
        });

        it('should set properties', () => {
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region'});

            should(uut.services).eql({});
            should(uut.config).eql({ environment: 'env', AWS_REGION: 'region'});
            should(uut.serviceId).eql('@sage/base-service-id');
            should(uut.initialised).eql(false);
        });

        it('should allow overriding serviceId', () => {
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region'}, 'test-service-id');

            should(uut.serviceId).eql('test-service-id');
        });
    });

    describe('run', () => {
        let event;
        let context;
        let callback;

        beforeEach(() => {
            event = {};
            context = {};
            callback = sandbox.stub();
        });

        it('should invoke callback with the result of buildResponse', () => {
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region'});
            sandbox.stub(RequestLogger, 'Create').returns(logger);
            sandbox.stub(uut, 'validate').returns(undefined);
            sandbox.stub(uut, 'init').resolves(undefined);
            sandbox.stub(uut, 'impl').resolves(undefined);
            sandbox.stub(uut, 'buildResponse').resolves([null, { statusCode: 201, body: '201_body' }]);

            return uut.run(event, context, callback)
                .then(() => {
                    should(callback.callCount).eql(1);
                    should(callback.calledWithExactly(null, { statusCode: 201, body: '201_body' })).eql(true);
                });
        });

        it('should invoke callback with the result of buildErrorResponse on error', () => {
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region'});
            sandbox.stub(RequestLogger, 'Create').returns(logger);
            sandbox.stub(uut, 'validate').returns(undefined);
            sandbox.stub(uut, 'init').resolves(undefined);
            sandbox.stub(uut, 'impl').rejects(new Error('impl_error'));
            sandbox.stub(uut, 'buildErrorResponse').resolves([null, { statusCode: 400, body: '400_body' }]);

            return uut.run(event, context, callback)
                .then(() => {
                    should(callback.callCount).eql(1);
                    should(callback.calledWithExactly(null, { statusCode: 400, body: '400_body' })).eql(true);
                });
        });

        it('should register a CloudWatchSubscription if SumoLogicLambdaARN is passed in config', () => {
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region', SumoLogicLambdaARN: 'arn'});
            sandbox.stub(RequestLogger, 'Create').returns(logger);
            sandbox.stub(uut, 'validate').returns(undefined);
            sandbox.stub(uut, 'init').resolves(undefined);
            sandbox.stub(uut, 'impl').resolves(undefined);
            sandbox.stub(uut, 'buildResponse').resolves([null, { statusCode: 201, body: '201_body' }]);
            sandbox.stub(CloudWatchSubscription, 'Register');

            context.logGroupName = 'log_group';

            return uut.run(event, context, callback)
                .then(() => {
                    should(CloudWatchSubscription.Register.callCount).eql(1);
                    should(
                        CloudWatchSubscription.Register.calledWithExactly('log_group', 'arn', logger)
                    ).eql(true);
                });
        });

        it('should not register a CloudWatchSubscription if SumoLogicLambdaARN is not passed in config', () => {
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region'});
            sandbox.stub(RequestLogger, 'Create').returns(logger);
            sandbox.stub(uut, 'validate').returns(undefined);
            sandbox.stub(uut, 'init').resolves(undefined);
            sandbox.stub(uut, 'impl').resolves(undefined);
            sandbox.stub(uut, 'buildResponse').resolves([null, { statusCode: 201, body: '201_body' }]);
            sandbox.stub(CloudWatchSubscription, 'Register');

            context.logGroupName = 'log_group';

            return uut.run(event, context, callback)
                .then(() => {
                    should(CloudWatchSubscription.Register.callCount).eql(0);
                });
        });

        it('should call the init function if initialised is false', () => {
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region', SumoLogicLambdaARN: 'arn'});
            sandbox.stub(RequestLogger, 'Create').returns(logger);
            sandbox.stub(uut, 'validate').returns(undefined);
            sandbox.stub(uut, 'init').resolves(undefined);
            sandbox.stub(uut, 'impl').resolves(undefined);
            sandbox.stub(uut, 'buildResponse').resolves([null, { statusCode: 201, body: '201_body' }]);

            uut.initialised = false;

            return uut.run(event, context, callback)
                .then(() => {
                    should(uut.init.callCount).eql(1);
                    should(uut.init.calledWithExactly(
                        event, { logger }
                    )).eql(true);
                });
        });

        it('should not call the init function if initialised is true', () => {
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region', SumoLogicLambdaARN: 'arn'});
            sandbox.stub(RequestLogger, 'Create').returns(logger);
            sandbox.stub(uut, 'validate').returns(undefined);
            sandbox.stub(uut, 'init').resolves(undefined);
            sandbox.stub(uut, 'impl').resolves(undefined);
            sandbox.stub(uut, 'buildResponse').resolves([null, { statusCode: 201, body: '201_body' }]);

            uut.initialised = true;

            return uut.run(event, context, callback)
                .then(() => {
                    should(uut.init.callCount).eql(0);
                });
        });

        it('should not call the impl function', () => {
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region', SumoLogicLambdaARN: 'arn'});
            sandbox.stub(RequestLogger, 'Create').returns(logger);
            sandbox.stub(uut, 'validate').returns(undefined);
            sandbox.stub(uut, 'init').resolves(undefined);
            sandbox.stub(uut, 'impl').resolves(undefined);
            sandbox.stub(uut, 'buildResponse').resolves([null, { statusCode: 201, body: '201_body' }]);

            return uut.run(event, context, callback)
                .then(() => {
                    should(uut.impl.callCount).eql(1);
                    should(uut.impl.calledWithExactly(
                        event, { logger }
                    )).eql(true);
                });
        });

        it('should create a logger and attach it to the event', () => {
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region', SumoLogicLambdaARN: 'arn'});
            sandbox.stub(RequestLogger, 'Create').returns(logger);
            sandbox.stub(uut, 'validate').returns(undefined);
            sandbox.stub(uut, 'init').resolves(undefined);
            sandbox.stub(uut, 'impl').resolves(undefined);
            sandbox.stub(uut, 'buildResponse').resolves([null, { statusCode: 201, body: '201_body' }]);

            event.logger = null;
            return uut.run(event, context, callback)
                .then(() => {
                    should(event.logger).eql(logger);
                });
        })
    });

    describe('validate', () => {
        it('should do nothing', () => {
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region'});

            should(uut.validate(null, { logger })).eql({ environment: 'env', AWS_REGION: 'region'});
        });
    });

    describe('init', () => {
        it('should do nothing', () => {
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region'});

            should(uut.init(null, { logger })).be.resolvedWith(undefined);
        });
    });

    describe('impl', () => {
        it('should throw', () => {
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region'});

            should(uut.impl(null, { logger })).be.rejectedWith(new Error('not implemented'));
        });
    });

    describe('buildResponse', () => {
        it('should return a default 200 response', () => {
            const val = { value: 'response' };
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region'});

            return uut.buildResponse(val, { logger })
                .then((response) => {
                    should(response).eql([null, { statusCode: 200, body: '{"value":"response"}' }]);
                });
        });
    });

    describe('buildErrorResponse', () => {
        it('should convert a StatusCodeError to a Diagnoses and return a lambda response', () => {
            const err = StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidConfig], ErrorSpecs.invalidConfig.statusCode);
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region'});

            return uut.buildErrorResponse(err, { logger })
                .then((response) => {
                    should(response).eql([
                        null,
                        {
                            body: '{"$diagnoses":[{"$applicationCode":"invalidConfig","$message":"invalid config properties","$sdataCode":"ApplicationDiagnosis","$severity":"Error"}]}',
                            statusCode: 400
                        }
                    ]);
                })

        });

        it('should convert a non-StatusCodeError to an internal server Diagnoses and return a lambda response', () => {
            const err = new Error('not_status_code_error');
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region'});

            return uut.buildErrorResponse(err, { logger })
                .then((response) => {
                    should(response).eql([
                        null,
                        {
                            body: '{"$diagnoses":[{"$applicationCode":"InternalServerError","$message":"an error occurred while processing the request","$sdataCode":"ApplicationDiagnosis","$severity":"Error"}]}',
                            statusCode: 500
                        }
                    ]);
                })
        });

        it('should return a fail lambda response if the error failLambda flag is set', () => {
            const err = StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidConfig], ErrorSpecs.invalidConfig.statusCode);
            err.failLambda = true;
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region'});

            return uut.buildErrorResponse(err, { logger })
                .then((response) => {
                    should(response).eql([
                        err,
                        {
                            body: '{"$diagnoses":[{"$applicationCode":"invalidConfig","$message":"invalid config properties","$sdataCode":"ApplicationDiagnosis","$severity":"Error"}]}',
                            statusCode: 400
                        }
                    ]);
                })
        })
    });

    describe('dispose', () => {
        it('should do nothing', () => {
            const uut = new Derived({ environment: 'env', AWS_REGION: 'region'});
            return uut.dispose()
                .then((actual) => {
                    should(actual).eql(undefined);
                });
        });
    });
});


