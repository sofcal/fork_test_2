const index = require('../../lib/index');
const HttpMethod = require('../../lib/HttpMethod');
const should = require('should');

describe('@sage/bc-util-httpmethod.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql({ HttpMethod });
        done();
    });
});
