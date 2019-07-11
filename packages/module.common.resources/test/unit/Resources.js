'use strict';

const Resources = require('../../lib/Resources');
const should = require('should');

describe('@sage/bc-common-resources', function() {
    it('should have the correct properties', (done) => {
        Resources.should.have.property('endpoints').which.is.a.Object();
        Resources.should.have.property('api').which.is.a.Object();
        Resources.should.have.property('services').which.is.a.Object();
        Resources.should.have.property('providers').which.is.a.Object();
        Resources.should.have.property('phase').which.is.a.Object();
        Resources.should.have.property('phaseDetails').which.is.a.Object();
        Resources.should.have.property('odata').which.is.a.Object();
        Resources.should.have.property('fixedLengthString').which.is.a.Object();
        Resources.should.have.property('regex').which.is.a.Object();
        Resources.should.have.property('regExMandatoryBankDetails').which.is.a.Object();
        Resources.should.have.property('rules').which.is.a.Object();
        Resources.should.have.property('schedule').which.is.a.Object();
        Object.isFrozen(Resources).should.be.true();
        done();
    });
});
