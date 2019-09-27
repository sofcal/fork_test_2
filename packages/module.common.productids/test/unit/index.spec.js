const index = require('../../lib/index');
const productIds = require('../../lib/productIds');
const should = require('should');

describe('@sage/bc-common-productids.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql(productIds);
        done();
    });
});
