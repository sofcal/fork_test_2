'use strict';

const alertTypes = require('../../lib/alertTypes');
const should = require('should');

describe('@sage/bc-common-alerttypes', function() {
    it('should have a property named as alerts', (done) => {
        alertTypes.should.have.property('alerts').which.is.a.Object();
        done();
    });
});
