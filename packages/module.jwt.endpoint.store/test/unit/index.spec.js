const index = require('../../lib/index');
const EndpointStore = require('../../lib/EndpointStore');
const should = require('should');

describe('@sage/sfab-s2s-jwt-endpoint-store.index', function(){
    it('should export the correct modules', () => {
        should(index).eql({ EndpointStore });
    });
});
