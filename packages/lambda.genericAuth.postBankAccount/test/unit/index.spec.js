const index = require('../../lib/index');
const ErrorSpecs = require('../../lib/ErrorSpecs');
const should = require('should');
const sinon = require('sinon');

describe('lambda-genericauth-postbankaccount', function(){
    let sandbox;
    let params, context, event;

    const errFunc = () => { throw new Error('should be stubbed') };
    const logFunc = (data) => {console.log(JSON.stringify(data))};

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
                        body: {"someKey":"Some Value"}
                    }
                }
            }]
        }
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should do nothing', (done) => {
        let something = index.run(event, context, {});

        //should(index.run).be.a.Function();
        done();
    });
});
