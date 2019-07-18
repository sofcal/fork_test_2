const index = require('../../lib/index');
const UncappedQuery = require('../../lib/UncappedQuery');
const should = require('should');

describe('@sage/bc-uncappedquery.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql(UncappedQuery);
        done();
    });
});
