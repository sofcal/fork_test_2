'use strict';

const resourcesSpec = require('../../lib/resources');

describe('@sage/bc-common-resources', function() {
    it('should have the correct properties', (done) => {
        resourcesSpec.should.have.property('endpoints').which.is.a.Object();
        resourcesSpec.should.have.property('api').which.is.a.Object();
        resourcesSpec.should.have.property('services').which.is.a.Object();
        resourcesSpec.should.have.property('providers').which.is.a.Object();
        resourcesSpec.should.have.property('phase').which.is.a.Object();
        resourcesSpec.should.have.property('phaseDetails').which.is.a.Object();
        resourcesSpec.should.have.property('odata').which.is.a.Object();
        resourcesSpec.should.have.property('fixedLengthString').which.is.a.Object();
        resourcesSpec.should.have.property('regex').which.is.a.Object();
        resourcesSpec.should.have.property('regExMandatoryBankDetails').which.is.a.Object();
        resourcesSpec.should.have.property('rules').which.is.a.Object();
        resourcesSpec.should.have.property('schedule').which.is.a.Object();
        Object.isFrozen(resourcesSpec).should.be.true();
        done();
    });
});
