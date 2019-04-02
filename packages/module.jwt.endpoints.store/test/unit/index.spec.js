const index = require('../../lib/index');
const should = require('should');

describe('@sage/sfab-s2s-jwt-endpoint-store.index', function(){
    it('should export the correct modules', (done) => {
        index.should.have.only.keys('EndpointsStore');
        done();
    });
});
