'use strict';

const ServiceNames = require('../../lib/ServiceNames');

describe('@sage/bc-servicenames', function() {
    it('should export an object', (done) => {
        ServiceNames.should.be.a.Object();
        done();
    });
});
