const MissingBankAccountsLambda = require('../../lib/MissingBankAccountsLambda');
const should = require('should');

describe('runonce-support-missingbankaccounts.index', function(){
    // placeholder
    it('should create an instance of MissingBankAccountsLambda', () => {
        should(new MissingBankAccountsLambda({})).be.an.instanceOf(MissingBankAccountsLambda);
    });
});
