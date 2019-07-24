const index = require('../../lib/index');
const JwtAuthenticator = require('../../lib/JwtAuthenticator');
const should = require('should');

describe('@sage/sfab-s2s-jwt-authenticator.index', function(){
    it('should export the correct modules', () => {
        should(index).eql({ JwtAuthenticator });
    });
});
