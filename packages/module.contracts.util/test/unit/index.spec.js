const index = require('../../lib/index');
const extend = require('../../lib/extend');
const validateType = require('../../lib/validateType');
const should = require('should');

describe('@sage/bc-contracts-util.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql({ extend, validateType });
        done();
    });
});
