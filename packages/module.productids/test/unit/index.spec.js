const index = require('../../lib/index');
const ProductIds = require('../../lib/ProductIds');
const should = require('should');

describe('@sage/bc-productids.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql(ProductIds);
        done();
    });
});
