const index = require('../../lib/index');
const should = require('should');

describe('__package_name__.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql({ });
        done();
    });
});