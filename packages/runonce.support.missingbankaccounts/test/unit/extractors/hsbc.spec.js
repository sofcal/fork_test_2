const hsbc = require('./../../../lib/extractors/hsbc')
const ErrorSpecs = require('./../../../lib/ErrorSpecs');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');
const should = require('should');
const util = require('util')

describe('runonce-support-missingbankaccounts.extractors.hsbc', function() {

    it('should return an array containing an object if there is one bank account', () => {
        const bankFileOneAccount = {
            AcceptRanges: 'bytes',
            LastModified: '2019-06-17T11:11:43.000Z',
            ContentLength: 75448,
            ETag: '"d723470fd74d56b9e2fdea9aa9aff9e1"',
            ContentType: 'text/plain',
            Metadata: {},
            Body: 'test1 \n03,12345612345678 340593845'
        };

        const expected = [{
            accountIdentifier: '12345678',
            bankIdentifier: '123456'
        }];

        const actual = hsbc(bankFileOneAccount);
        should(actual).eql(expected);
    });

    it('should return an array containing objects if there is are multiple accounts', () => {
        const bankFileMultipleAccounts = {
            AcceptRanges: 'bytes',
            LastModified: '2019-06-17T11:11:43.000Z',
            ContentLength: 75448,
            ETag: '"d723470fd74d56b9e2fdea9aa9aff9e1"',
            ContentType: 'text/plain',
            Metadata: {},
            Body: 'test1 \n03,12345612345678 \n03,12345112345671 \n03,65432187654321 340593845'
        }

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
        const bankFileMultipleAccounts = {
            AcceptRanges: 'bytes',
            LastModified: '2019-06-17T11:11:43.000Z',
            ContentLength: 75448,
            ETag: '"d723470fd74d56b9e2fdea9aa9aff9e1"',
            ContentType: 'text/plain',
            Metadata: {},
            Body: 'test1 \n03,12345612345678,897889729834234 \n03,12345112345671,987987487298423432 \n03,65432187654321 340593845'
        }

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
        const bankFilePartialBody = {
            AcceptRanges: 'bytes',
            LastModified: '2019-06-17T11:11:43.000Z',
            ContentLength: 75448,
            ETag: '"d723470fd74d56b9e2fdea9aa9aff9e1"',
            ContentType: 'text/plain',
            Metadata: {},
            Body: 'test1 \n03,123456'
        }
        
        const expected = [];

        const actual = hsbc(bankFilePartialBody);
        should(actual).eql(expected);
    });

    it('should return an empty array if there are no bank accounts found', () => {
        const bankFileNoAccounts = {
            AcceptRanges: 'bytes',
            LastModified: '2019-06-17T11:11:43.000Z',
            ContentLength: 75448,
            ETag: '"d723470fd74d56b9e2fdea9aa9aff9e1"',
            ContentType: 'text/plain',
            Metadata: {},
            Body: 'test1 \n04,12345612345678 340593845'
        }
        
        const expected = [];

        const actual = hsbc(bankFileNoAccounts);
        should(actual).eql(expected);
    });

    it('should not return values that are not at the start of the line', () => {
        const bankFileMultipleAccounts = {
            AcceptRanges: 'bytes',
            LastModified: '2019-06-17T11:11:43.000Z',
            ContentLength: 75448,
            ETag: '"d723470fd74d56b9e2fdea9aa9aff9e1"',
            ContentType: 'text/plain',
            Metadata: {},
            Body: 'test1 \n03,12345612345678,897889729834234 03,12345112345671,987987487298423432 03,65432187654321 340593845'
        }

        const expected = [{
            accountIdentifier: '12345678',
            bankIdentifier: '123456'
        }];

        const actual = hsbc(bankFileMultipleAccounts);
        should(actual).eql(expected);
    });

    it('should return the correct values in an array of objects', () => {
        const bankFileTwoAccounts = {
            AcceptRanges: 'bytes',
            LastModified: '2019-06-17T11:11:43.000Z',
            ContentLength: 75448,
            ETag: '"d723470fd74d56b9e2fdea9aa9aff9e1"',
            ContentType: 'text/plain',
            Metadata: {},
            Body: 'test1 \n03,12345612345678 \n03,12345112345671 \n01,340593845'
        }

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

    it('should validate and throw if the input has no Body', () => {
        const bankFileNoBody = {
            AcceptRanges: 'bytes',
            LastModified: '2019-06-17T11:11:43.000Z',
            ContentLength: 75448,
            ETag: '"d723470fd74d56b9e2fdea9aa9aff9e1"',
            ContentType: 'text/plain',
            Metadata: {}
        }

        should(
            () => hsbc(bankFileNoBody)
        ).throwError(StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidExtractorInput.body], ErrorSpecs.invalidExtractorInput.body.statusCode));
    });
});
