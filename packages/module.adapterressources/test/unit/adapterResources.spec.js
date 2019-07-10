'use strict';

const AdapterResources = require('../../lib/AdapterResources');
const should = require('should');

describe('@sage/bc-adapterresources', function() {
    it('should have a property named as alerts', (done) => {
        AdapterResources.should.have.properties('errors', 'literals', 'bankProgressLog', 'offBoarding', 
            'bankAuthorisationForm', 'transactionTypes', 'transactionTypesMasked', 'validationAction', 
            'regex', 'dataEnrichment');
        done();
    });
});
