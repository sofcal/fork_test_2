const index = require('../../lib/index');
const bankIds = require('../../lib/bankIds');
const should = require('should');

describe('@sage/bc-bankIds.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql( bankIds );
        done();
    });
});
