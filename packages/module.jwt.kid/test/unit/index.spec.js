const index = require('../../lib/index');
const Kid = require('../../lib/Kid');
const should = require('should');

describe('@sage/bc-request-logger.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql({ Kid });
        done();
    });
});