const index = require('../../lib/index');
const resources = require('../../lib/resources');
const should = require('should');

describe('@sage/bc-adapters-resources.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql(resources);
        done();
    });
});
