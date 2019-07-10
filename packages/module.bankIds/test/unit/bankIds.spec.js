'use strict';

const bankIds = require('../../lib/bankIds'); 
const should = require('should');

describe('@sage/bc-bankIds.bankIds', function() {
    it('should have a property named as absa', (done) => {
        bankIds.should.have.property('absa').which.is.a.String();
        done();
    });
});
