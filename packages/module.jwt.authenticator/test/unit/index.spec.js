const index = require('../../lib/index');
const should = require('should');

describe('internal-jwt-authenticator.index', function(){
    it('should export the correct modules', (done) => {
        index.should.have.only.keys('Authenticate');
        done();
    });
});
