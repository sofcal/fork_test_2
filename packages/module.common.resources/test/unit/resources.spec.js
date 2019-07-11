'use strict';

const ResourcesSpec = require('../../lib/Resources');

describe('@sage/bc-common-resources', function() {
    it('should have the correct properties', (done) => {
        ResourcesSpec.should.have.property('endpoints').which.is.a.Object();
        ResourcesSpec.should.have.property('api').which.is.a.Object();
        ResourcesSpec.should.have.property('services').which.is.a.Object();
        ResourcesSpec.should.have.property('providers').which.is.a.Object();
        ResourcesSpec.should.have.property('phase').which.is.a.Object();
        ResourcesSpec.should.have.property('phaseDetails').which.is.a.Object();
        ResourcesSpec.should.have.property('odata').which.is.a.Object();
        ResourcesSpec.should.have.property('fixedLengthString').which.is.a.Object();
        ResourcesSpec.should.have.property('regex').which.is.a.Object();
        ResourcesSpec.should.have.property('regExMandatoryBankDetails').which.is.a.Object();
        ResourcesSpec.should.have.property('rules').which.is.a.Object();
        ResourcesSpec.should.have.property('schedule').which.is.a.Object();
        Object.isFrozen(ResourcesSpec).should.be.true();
        done();
    });
});
