const index = require('../../lib/index');
const StatusCodeError = require('../../lib/StatusCodeError');
const StatusCodeErrorItem = require('../../lib/StatusCodeErrorItem');
const should = require('should');

describe('@sage/bc-statuscodeerror.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql({ StatusCodeErrorItem, StatusCodeError });
        done();
    });
});
