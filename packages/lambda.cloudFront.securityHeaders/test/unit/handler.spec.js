const handler = require('../../lib/handler');
const impl = require('../../lib/impl');
const keys = require('../../lib/params');
const ErrorSpecs = require('../../lib/ErrorSpecs');
const should = require('should');
const sinon = require('sinon');

const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-common-statuscodeerror');

describe('cloudFront.securityHeaders.handler', function() {
    let sandbox;
    let params, context, event;

    const errFunc = () => { throw new Error('should be stubbed') };
    const logFunc = (data) => {console.log(JSON.stringify(data))};
    const dummyLoader = { load: errFunc };

    const htmlBody = '<HEAD/><BODY>Test</BODY>';
    const bodyString = JSON.stringify(htmlBody);


    before(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {
        context = { context: 'context' };

        event = {
            logger: {info: logFunc, error: logFunc},
            Records: [{
                cf: {
                    request: {
                        origin: {
                            s3: {
                                customHeaders: {
                                    environment: [{
                                        key: 'Environment',
                                        value: 'test'
                                    }]
                                }
                            }
                        },
                        uri: 'https://www.test.com/banking-cloud/dosomething',
                        querystring: ''
                    },
                    response: {
                        headers: {},
                        body: bodyString
                    }
                }
            }]
        };

        params = {
            test: 'test'
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should retrieve params from param-store', (done) => {
        //sandbox.stub(process, 'env').value({ AWS_REGION: region, Environment: env });
        sandbox.stub(dummyLoader, 'load').resolves(params);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);

        const expected = { value: 'result' };
        sandbox.stub(impl, 'run').resolves(expected);

        handler.run(event, context, () => {
            try {
                const paramPrefix = '/test/';
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
        sandbox.stub(dummyLoader, 'load').resolves(params);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);

        const expected = { value: 'result' };
        sandbox.stub(impl, 'run').resolves(expected);

        handler.run(event, context, () => {
            try {
                should(impl.run.callCount).eql(1);
                should(impl.run.calledWithExactly(
                    event, params
                )).eql(true);

                done();
            } catch(err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    it('should call the callback with the success response', (done) => {
        sandbox.stub(dummyLoader, 'load').resolves(params);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);


        const expected = { value: 'result' };
        sandbox.stub(impl, 'run').resolves(expected);

        handler.run(event, context, (first, second) => {
            try {
                should(first).eql(null);
                console.log('XXX second', second);
                should(second).eql(expected);

                done();
            } catch(err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    it('should call the callback with diagnoses', (done) => {
        sandbox.stub(dummyLoader, 'load').resolves(params);
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
        sandbox.stub(dummyLoader, 'load').resolves(params);
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

    // skipped becase param store static loader uses promisifyAll
    it.skip('should fail if any param store values are missing', function(done) {

        sandbox.stub(dummyLoader, 'load').resolves(undefined);

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
