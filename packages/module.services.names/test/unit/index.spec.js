const index = require('../../lib/index');
const ServiceNames = require('../../lib/ServiceNames');
const should = require('should');

describe('@sage/bc-services-names.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql(ServiceNames);
        done();
    });
});