'use strict';

const resources = require('../../lib/resources');

describe('@sage/bc-adapters-resources', function() {
    it('should have the correct properties', (done) => {
        resources.should.have.properties('errors', 'literals', 'bankProgressLog', 'offBoarding',
            'bankAuthorisationForm', 'transactionTypes', 'transactionTypesMasked', 'validationAction',
            'regex', 'dataEnrichment');
        done();
    });
});
