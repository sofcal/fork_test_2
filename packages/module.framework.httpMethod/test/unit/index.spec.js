const index = require('../../lib/index');
const httpMethod = require('../../lib/httpMethod');
const should = require('should');

describe('@sage/bc-framework-httpmethod.index', function(){
    it('should export the correct modules', (done) => {
        should(index).eql(httpMethod);
        done();
    });
});
