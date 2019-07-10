const index = require('../../lib/index');
const AdapterResources = require('../../lib/AdapterResources');
const should = require('should');

describe('@sage/bc-adapterresources.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql(AdapterResources);
        done();
    });
});
