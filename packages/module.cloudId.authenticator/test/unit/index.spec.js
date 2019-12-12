const index = require('../../lib/index');
const CloudIdAuthenticator = require('../../lib/CloudIdAuthenticator');
const should = require('should');

describe('@sage/sfab-s2s-cloudId-authenticator.index', function(){
    it('should export the correct modules', () => {
        should(index).eql({ CloudIdAuthenticator });
    });
});
