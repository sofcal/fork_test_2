const index = require('../../lib/index');
const Transaction = require('../../lib/Transaction');
const TransactionBucket = require('../../lib/TransactionBucket');
const should = require('should');

describe('@sage/bc-transaction', function(){
    it('should export the correct modules', (done) => {
        should(index).eql({ Transaction, TransactionBucket });
    done();
});
});
