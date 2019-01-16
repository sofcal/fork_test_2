const handler = require('../../lib/handler');
const impl = require('../../lib/impl');
const keys = require('../../lib/params');
const ErrorSpecs = require('../../lib/ErrorSpecs');
const should = require('should');
const sinon = require('sinon');
const Promise = require('bluebird');

const { ParameterStoreStaticLoader } = require('internal-parameterstore-static-loader');
const { StatusCodeError, StatusCodeErrorItem } = require('internal-status-code-error');

describe('cloudFront.securityHeaders.handler', function() {
    let sandbox;
    let config, context, event;

    const domain = 'domain';

    const env = 'local';
    const region = 'eu-west-1';

    const errFunc = () => { throw new Error('should be stubbed') };
    const dummyLoader = { load: errFunc };

    before(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {
        context = { context: 'context' };
        event = { };

        config = {
            domain
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should retrieve params from param-store', (done) => {
        sandbox.stub(process, 'env').value({ AWS_REGION: region, Environment: env });
        sandbox.stub(dummyLoader, 'load').resolves(config);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);

        const expected = { value: 'result' };
        sandbox.stub(impl, 'run').resolves(expected);

        handler.run(event, context, () => {
            try {
                const paramPrefix = '/local/';
                const region = 'eu-west-1';

                should(ParameterStoreStaticLoader.Create.callCount).eql(1);
                should(ParameterStoreStaticLoader.Create.calledWithExactly(
                    { keys, paramPrefix, env: { region } }
                )).eql(true);


                should(dummyLoader.load.callCount).eql(1);
                should(dummyLoader.load.calledWith(
                    {}
                )).eql(true);

                done();
            } catch(err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    it('should call impl.run', (done) => {
        sandbox.stub(process, 'env').value({ AWS_REGION: region, Environment: env });
        sandbox.stub(dummyLoader, 'load').resolves(config);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);

        const expected = { value: 'result' };
        sandbox.stub(impl, 'run').resolves(expected);

        handler.run(event, context, () => {
            try {
                should(impl.run.callCount).eql(1);
                should(impl.run.calledWithExactly(
                    event, config, { db }
                )).eql(true);

                done();
            } catch(err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    it('should call impl.run with concatenated services', (done) => {
        sandbox.stub(process, 'env').value({ AWS_REGION: region, Environment: env });
        sandbox.stub(dummyLoader, 'load').resolves(config);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);

        const expected = { value: 'result' };
        sandbox.stub(impl, 'run').resolves(expected);

        handler.run(event, context, () => {
            try {
                should(impl.run.callCount).eql(1);
                should(impl.run.calledWithExactly(
                    event, config
                )).eql(true);

                done();
            } catch(err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    it('should call the callback with the success response', (done) => {
        sandbox.stub(process, 'env').value({ AWS_REGION: region, Environment: env });
        sandbox.stub(dummyLoader, 'load').resolves(config);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);


        const expected = { value: 'result' };
        sandbox.stub(impl, 'run').resolves(expected);

        handler.run(event, context, (first, second) => {
            try {
                should(first).eql(null);

                should(second).eql({
                    //TODO: Check response and headers
                });

                done();
            } catch(err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    it('should call the callback with diagnoses', (done) => {
        sandbox.stub(process, 'env').value({ AWS_REGION: region, Environment: env });
        sandbox.stub(dummyLoader, 'load').resolves(config);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);

        const expected = StatusCodeError.Create([StatusCodeErrorItem.Create('Code', 'Message')], 400);
        sandbox.stub(impl, 'run').rejects(expected);

        handler.run(event, context, (first, second) => {
            try {
                should(first).eql(null);

                should(second).eql({
                    statusCode: 400,
                    body: JSON.stringify(expected.toDiagnoses())
                });

                done();
            } catch(err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    it('should call the callback with a default 500 if impl throws an unexpected error', (done) => {
        sandbox.stub(process, 'env').value({ AWS_REGION: region, Environment: env });
        sandbox.stub(dummyLoader, 'load').resolves(config);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);

        const err = new Error('impl.run.error');
        sandbox.stub(impl, 'run').rejects(err);

        handler.run(event, context, (first, second) => {
            try {
                should(first).eql(null);

                const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.internalServer], ErrorSpecs.internalServer.statusCode);
                should(second).eql({
                    statusCode: 500,
                    body: JSON.stringify(expected.toDiagnoses())
                });

                done();
            } catch(err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    it('should fail if any param store values are missing', function(done) {
        delete config['defaultMongo.password'];

        sandbox.stub(process, 'env').value({ AWS_REGION: region, Environment: env });
        sandbox.stub(dummyLoader, 'load').resolves(config);

        handler.run(event, context, (first, second) => {
            try {
                should(first).eql(null);

                const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.failedToRetrieveParameters], ErrorSpecs.failedToRetrieveParameters.statusCode);
                should(second).eql({
                    statusCode: 500,
                    body: JSON.stringify(expected.toDiagnoses())
                });

                done();
            } catch(err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });
});
