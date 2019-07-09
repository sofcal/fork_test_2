'use strict';

const AlertTypes = require('../../lib/AlertTypes');
const should = require('should');

describe('@sage/bc-alerttypes.AlertTypes', function() {
    it('should have a property named as alerts', (done) => {
        AlertTypes.should.have.property('alerts').which.is.a.Object();
        done();
    });
});
