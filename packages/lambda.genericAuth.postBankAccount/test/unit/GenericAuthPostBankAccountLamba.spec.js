const sinon = require('sinon');
const GenericAuthPostBankAccountLambda = require('../../lib/GenericAuthPostBankAccountLambda');
const { RequestLogger } = require('@sage/bc-requestlogger');
const { logger: loggerGen } = require('@sage/bc-debug-utils');
const should = require('should');

describe('lambda-genericauth-postbankaccount', function(){
    let sandbox;
    const logger = loggerGen(true);
    const config = {config: 'value'};

    const event = {
        logger: logger,
        body: {
            "bankAccount": {
                "accountIdentifier": "7531af69-fcc3-4d7c-937d-8c67aa20b9ef",
                "accountKey": "12345"
            }
        }
    };

    before(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {
        // TODO: Setup generic stubs
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
        //sandbox.stub(RequestLogger, 'Create').returns(logger);
        //sandbox.stub(postBankLambda, 'validate').returns(true);
        //sandbox.stub(postBankLambda, 'impl').resolves(undefined);
        //sandbox.stub(postBankLambda, 'buildResponse').resolves([null, { statusCode: 201, body: '201_body' }]);

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
