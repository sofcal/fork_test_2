const index = require('../../lib/index');
const RequestLogger = require('../../lib/RequestLogger');
const should = require('should');

describe('internal-request-logger.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql({ RequestLogger });
        done();
    });
});