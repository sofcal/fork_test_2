const index = require('../../lib/index');
const JWTIssuer = require('../../lib/JWTIssuer');
const should = require('should');

describe('@sage/sfab-s2s-jwt-issuer.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql({ JWTIssuer });
        done();
    });
});