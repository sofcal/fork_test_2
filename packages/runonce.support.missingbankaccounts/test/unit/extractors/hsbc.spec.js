const hsbc = require('./../../../lib/extractors/hsbc')
const should = require('should');

describe('runonce-support-missingbankaccounts.extractors.hsbc', function() {

    it('should return an array containing an object if there is one bank account', () => {
        const bankFileOneAccount = 'test1 \n03,12345612345678 340593845';

        const expected = [{
            accountIdentifier: '12345678',
            bankIdentifier: '123456'
        }];

        const actual = hsbc(bankFileOneAccount);
        should(actual).eql(expected);
    });

    it('should return an array containing objects if there is are multiple accounts', () => {
        const bankFileMultipleAccounts = 'test1 \n03,12345612345678 \n03,12345112345671 \n03,65432187654321 340593845';

        const expected = [{
            accountIdentifier: '12345678',
            bankIdentifier: '123456'
        },{
            accountIdentifier: '12345671',
            bankIdentifier: '123451'
        }, {
            accountIdentifier: '87654321',
            bankIdentifier: '654321'
        }];

        const actual = hsbc(bankFileMultipleAccounts);
        should(actual).eql(expected);
    });

    it('should return an array containing objects if there is are multiple accounts with comma separated values', () => {
        const bankFileMultipleAccounts = 'test1 \n03,12345612345678,897889729834234 \n03,12345112345671,987987487298423432 \n03,65432187654321 340593845';

        const expected = [{
            accountIdentifier: '12345678',
            bankIdentifier: '123456'
        },{
            accountIdentifier: '12345671',
            bankIdentifier: '123451'
        }, {
            accountIdentifier: '87654321',
            bankIdentifier: '654321'
        }];

        const actual = hsbc(bankFileMultipleAccounts);
        should(actual).eql(expected);
    });

    it('should return an empty array if given a partial body', () => {
        const bankFilePartialBody = 'test1 \n03,123456';
        
        const expected = [];

        const actual = hsbc(bankFilePartialBody);
        should(actual).eql(expected);
    });

    it('should return an empty array if there are no bank accounts found', () => {
        const bankFileNoAccounts = 'test1 \n04,12345612345678 340593845';
        
        const expected = [];

        const actual = hsbc(bankFileNoAccounts);
        should(actual).eql(expected);
    });

    it('should not return values that are not at the start of the line', () => {
        const bankFileMultipleAccounts = 'test1 \n03,12345612345678,897889729834234 03,12345112345671,987987487298423432 03,65432187654321 340593845';

        const expected = [{
            accountIdentifier: '12345678',
            bankIdentifier: '123456'
        }];

        const actual = hsbc(bankFileMultipleAccounts);
        should(actual).eql(expected);
    });

    it('should return the correct values in an array of objects', () => {
        const bankFileTwoAccounts = 'test1 \n03,12345612345678 \n03,12345112345671 \n01,340593845';

        const expected = [{
            accountIdentifier: '12345678',
            bankIdentifier: '123456'
        },
        {
            accountIdentifier: '12345671',
            bankIdentifier: '123451'
        }
    ]
        const actual = hsbc(bankFileTwoAccounts);
        should(actual).eql(expected);
    });

    it('should return the correct values in an array of objects when string starts with a match', () => {
        const bankFileTwoAccounts = '03,12345612345678 \n03,12345112345671 \n01,340593845';

        const expected = [{
            accountIdentifier: '12345678',
            bankIdentifier: '123456'
        },
        {
            accountIdentifier: '12345671',
            bankIdentifier: '123451'
        }
    ]
        const actual = hsbc(bankFileTwoAccounts);
        should(actual).eql(expected);
    });
});
