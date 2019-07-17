const MissingBankAccountsLambda = require('../../lib/MissingBankAccountsLambda');
const index = require('../../lib/index');
const should = require('should');

describe('runonce-support-missingbankaccounts.index', function(){

    it('should create an instance of MissingBankAccountsLambda', () => {
        const config = { OutputBucket: outputBucket = 'missing-accounts-test-bucket', Environment: env = 'test', AWS_REGION: region = 'local' };
        const actual = new MissingBankAccountsLambda({ config });
        should(actual).be.an.instanceof(MissingBankAccountsLambda);
    });

});

