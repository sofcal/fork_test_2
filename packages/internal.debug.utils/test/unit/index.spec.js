const index = require('../../lib/index');
const timer = require('../../lib/timer');
const should = require('should');

describe('internal-debug-utils.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql({ timer });
        done();
    });
});