const sinon = require('sinon');
const GenericAuthPostBankAccountLambda = require('../../lib/GenericAuthPostBankAccountLambda');
const should = require('should');


describe('lambda-genericauth-postbankaccount', function(){
    let sandbox;

    const log = (obj) => console.log(`[TEST] ${JSON.stringify(obj)}`);
    const logger = {debug: log, info: log, warn: log, error: log};
    const config = {config: 'value'};


    // EVENT: {"key1":"value1","key2":"value2","key3":"value3","logger":{"request":{"service":"@sage/base-service-id"}}}

    const logFunc = (data) => {console.log(JSON.stringify(data))};
    const event = {
        logger: {info: "", error: logFunc},
        Records: [{
            cf: {
                request: {
                    headers: {},
                    body: {"key":'value'}
                },
                response: {
                    headers: {},
                    body: {"requestId":"12345"}
                }
            }
        }]
    };

    before(() => {
        sandbox = sinon.createSandbox();

    });

    beforeEach(() => {

    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should create post bank account lambda correctly', () => {
        const postBankLambda = GenericAuthPostBankAccountLambda.Create({});
        should(postBankLambda.dbName).equal('bank_db');
    });

    it('should validate event and config', () => {
        const postBankLambda = GenericAuthPostBankAccountLambda.Create(config);
        should(postBankLambda.validate({},{logger})).equal(config.config);
    });

    it.skip('should test init', () => {
        const postBankLambda = GenericAuthPostBankAccountLambda.Create(config);
        const expectedRes = { statusCode: 200, body: 'Success'};

        return postBankLambda.init({},{logger})
            .then((actual) => {
                should(actual).eql(expectedRes);
            })
    });

    it.skip('should test impl', () => {
        const postBankLambda = GenericAuthPostBankAccountLambda.Create(config);
        const expectedRes = { statusCode: 200, body: 'Success'};

        //TODO: Stubbing bonanza
        return postBankLambda.impl(event,{logger})
            .then((actual) => {
                should(actual).eql(expectedRes);
            })
    });
});
