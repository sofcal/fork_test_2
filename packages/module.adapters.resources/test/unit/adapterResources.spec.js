'use strict';

const AdapterResources = require('../../lib/AdapterResources');

describe('@sage/bc-adapter-resources', function() {
    it('should have the correct properties', (done) => {
        AdapterResources.should.have.properties('errors', 'literals', 'bankProgressLog', 'offBoarding',
            'bankAuthorisationForm', 'transactionTypes', 'transactionTypesMasked', 'validationAction',
            'regex', 'dataEnrichment');
        done();
    });
});
