'use strict';

const RuleSpec = require('../../lib/Rule');

describe('@sage/bc-rule', function() {
    it('should have the correct properties', (done) => {
        RuleSpec.should.have.property('operations').which.is.a.Object();

        RuleSpec.operations.should.have.property('contains').which.is.a.String();
        RuleSpec.operations.should.have.property('doesNotContain').which.is.a.String();
        RuleSpec.operations.should.have.property('eq').which.is.a.String();
        RuleSpec.operations.should.have.property('gt').which.is.a.String();
        RuleSpec.operations.should.have.property('lt').which.is.a.String();
        RuleSpec.operations.should.have.property('gte').which.is.a.String();
        RuleSpec.operations.should.have.property('lte').which.is.a.String();

        RuleSpec.types.should.property('user').which.is.a.String();
        RuleSpec.types.should.property('accountant').which.is.a.String();
        RuleSpec.types.should.property('feedback').which.is.a.String();
        RuleSpec.types.should.property('global').which.is.a.String();

        Object.isFrozen(RuleSpec).should.be.true();
        done();
    });
});
