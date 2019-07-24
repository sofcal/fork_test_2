const index = require('../../lib/index');
const FuzzyAccess = require('../../lib/FuzzyAccess');
const should = require('should');

describe('@sage/bc-util-fuzzyaccess.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql({ FuzzyAccess });
        done();
    });
});
