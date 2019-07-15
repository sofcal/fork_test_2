const index = require('../../lib/index');
const Query = require('../../lib/Query');
const should = require('should');

describe('@sage/bc-query.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql(Query);
        done();
    });
});
