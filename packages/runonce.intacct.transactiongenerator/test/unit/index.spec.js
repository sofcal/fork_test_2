const CreateTransactionsLambda = require('../../lib/CreateTransactionsLambda');
const should = require('should');

describe('runonce-intacct-transactiongenerator.index', function(){
    // placeholder
    it('should create an instance of CreateTransactionsLambda', () => {
        should(new CreateTransactionsLambda({})).be.an.instanceOf(CreateTransactionsLambda);
    });
});
