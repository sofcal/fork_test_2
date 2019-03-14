const index = require('../../src/index');
const should = require('should');

describe('internal-jwks-store.index', function(){
    it('should export the correct modules', (done) => {
        index.should.have.only.keys('EndPointsStore');
        done();
    });
});
