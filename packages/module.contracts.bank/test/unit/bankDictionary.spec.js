const bankDictionary = require('../../lib/bankDictionary');
const should = require('should');

describe('@sage/bc-bank.bankDictionary', () => {
    it('should export bankDictionary', () => {
        should(bankDictionary).be.an.Object().with.properties(
            'AuthorisationMechanism',
            'accountTypes',
            'statuses',
            'internalStatusValues',
            'dataProviders',
            'aggregatorProviders',
            'quarantineValidationStatus',
            'offBoardingTypes',
        );
    });
});
