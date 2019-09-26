'use strict';

const ProductIds = require('../../lib/ProductIds');

describe('@sage/bc-common-productids', function() {
    it('should export an object with the correct properties', (done) => {
        ProductIds.should.be.a.Object().with.properties(
            'sagelive',
            'sageLiveAccountant',
            'sageOne',
            'sageUKI50Accounts',
            'sageUKI200Accounts',
            'sageUS50Accounts',
            'sageCA50Accounts',
            'sageES50Accounts',
            'sageUS100Accounts',
            'sageUS100Contractor',
            'sageCA100Contractor',
            'sageES200Accounts',
            'sageZA50Accounts',
            'sageIntegration',
            'sageMigration',
            'sageIntacct',
            'sageIntacctSig',
            'sageZAEvolution',
            'sageMY50Accounts'
        );
        done();
    });
});
