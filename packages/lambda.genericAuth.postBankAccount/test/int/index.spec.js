const sinon = require('sinon');
const GenericAuthPostBankAccountLambda = require('../../lib/GenericAuthPostBankAccountLambda');
const { RequestLogger } = require('@sage/bc-requestlogger');
const { logger: loggerGen } = require('@sage/bc-debug-utils');
const should = require('should');

describe('lambda-genericauth-postbankaccount',function(){
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

    it.skip('should do something', (done) => {
        const postBankLambda = GenericAuthPostBankAccountLambda.Create(config);
        const expectedRes = { statusCode: 200, body: 'Success'};

        return postBankLambda.init(event,{logger})
            .then((actual) => {
                should(actual).eql(expectedRes);
            })
    });
});
