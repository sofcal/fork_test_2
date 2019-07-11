'use strict';

const ProductIds = require('../../lib/ProductIds');
const should = require('should');

describe('@sage/bc-productids', function() {
    it('should have a property named as alerts', (done) => {
        ProductIds.should.be.a.Object();
        done();
    });
});
