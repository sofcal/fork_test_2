const index = require('../../lib/index');
const QuarantineBucket = require('../../lib/QuarantineBucket');
const should = require('should');

describe('@sage/bc-quarantine.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql(QuarantineBucket);
        done();
    });
});
