const index = require('../../lib/index');
const Lock = require('../../lib/Lock');
const should = require('should');

describe('@sage/bc-contracts-lock.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql(Lock);
        done();
    });
});
