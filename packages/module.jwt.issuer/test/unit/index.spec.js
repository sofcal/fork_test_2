const index = require('../../lib/index');
const JwtIssuer = require('../../lib/JwtIssuer');
const JwtCertInfo = require('../../lib/JwtCertInfo');
const should = require('should');

describe('@sage/sfab-s2s-jwt-issuer.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql({ JwtIssuer, JwtCertInfo });
        done();
    });
});