'use strict';

const ProductIds = require('../../lib/ProductIds');
const should = require('should');

describe('@sage/bc-productids', function() {
    it('should have a property named as alerts', (done) => {
        ProductIds.should.have.property('alerts').which.is.a.Object();
        done();
    });
});
