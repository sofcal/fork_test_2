const index = require('../../lib/index');
const GenericAuthPostBankAccountLambda = require('../../lib/GenericAuthPostBankAccountLambda');
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
            body: {
                "bankAccount": {
                    "accountIdentifier": "7531af69-fcc3-4d7c-937d-8c67aa20b9ef",
                    "accountKey": "12345"
                }
            }
        }
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should verify entry point', (done) => {
        should(index.run).be.a.Function();
        done();
    });

    it('should callback on successful execution', (done) => {
        index.run(event, context, () => { return true })
            .then(() => {
                // TODO: Verify something
                done();
            });
    });
});
