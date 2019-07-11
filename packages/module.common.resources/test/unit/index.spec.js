const index = require('../../lib/index');
const Resources = require('../../lib/Resources');
const should = require('should');

describe('@sage/bc-common-resources.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql( Resources );
        done();
    });
});
