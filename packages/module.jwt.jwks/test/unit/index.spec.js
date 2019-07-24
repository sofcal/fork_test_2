const index = require('../../lib');
const Jwks = require('../../lib/Jwks');
const should = require('should');

describe('@sage/sfab-s2s-jwt-jwks.index', function() {
    it('should export the correct modules', (done) => {
        should(index).eql({ Jwks });
        done();
    });
});
