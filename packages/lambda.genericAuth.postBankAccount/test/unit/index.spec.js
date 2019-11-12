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
                        body: {"requestId":"12345"}
                    }
                }
            }]
        }
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should do nothing', (done) => {
        should(index.run).be.a.Function();
        done();
    });

    it('should do something', (done) => {
        let something = index.run(event, context, () => { console.log('Woot!') });
        done();
    });
});
