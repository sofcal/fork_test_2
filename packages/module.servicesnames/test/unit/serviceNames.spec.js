'use strict';

const ServiceNames = require('../../lib/ServiceNames');

describe('@sage/bc-servicenames', function() {
    it('should export an object with the correct properties', (done) => {
        ServiceNames.should.be.a.Object().with.properties(
            'activity',
            'encryption',
            'transaction',
            'transactionBucket',
            'unresolved',
            'quarantine',
            'claim',
            'bank',
            'product',
            'organisation',
            'user',
            'company',
            'bankAccount',
            'rule',
            'companyData',
            's3',
            'keyValuePairCache',
            'emailTemplate',
            'endpointRateLimit',
            'lock',
            'analytics',
            'bankLocale',
            'schedule',
            'scheduleStorage',
            'providerAccessAccount',
            'persistedCacheEntry',
            'organisationExt',
            'companyExt'
        );
        done();
    });
});
