const index = require('../../../lib');
const Queries = require('../../../lib/Queries');
const should = require('should');

describe('@sage/bc-queries.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql(Queries);
        done();
    });
});
