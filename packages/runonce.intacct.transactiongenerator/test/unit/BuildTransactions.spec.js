const sinon = require('sinon');
const BuildTransactions = require('../../lib/BuildTransactions');
const should = require('should');
const uuid = require('uuid/v4');
const _ = require('underscore');

describe('BuildTransactions', () => {

    let sandbox;
    let clock;
    const now = new Date('2019-04-08T12:59:41.804Z');
    const expectedTrx = [
        {
            _id: 'stubbed',
            transactionType: 'CASH',
            transactionStatus: 'posted',
            datePosted: '2019-04-08T12:59:41.804Z',
            dateUserInitiated: '2019-04-08T12:59:41.804Z',
            dateFundsAvailable: null,
            transactionAmount: 0.01,
            transactionId: null,
            incrementedId: 1,
            correctionId: null,
            correctionAction: null,
            checkNum: '1',
            referenceNumber: 'ref 1',
            name: 'Cash',
            extendedName: null,
            payee: {
                payeeId: null,
                city: null,
                state: null,
                postalCode: null,
                country: null
            },
            coordinates: {
                lat: 0,
                long: 0
            },
            narrative1: 'Invoice 1',
            narrative2: 'Deposit',
            currency: 'USD',
            category: {
                topLevelCategory: 'Deposits',
                subCategory: 'INCOME',
                categoryId: 27
            },
            bankAccountId: '1',
            transactionIndex: 0,
            fileIdentificationNumber: 0,
            dateFileArrived: null,
            transactionHash: '',
            accountsPostings: [],
            transactionNarrative: '',
            internalProcessingStatus: null,
            raw: {
                transactionCode: 'aggregator',
                lineNumberFirst: 0,
                lineNumberLast: 0,
                lineContent: 'aggregator',
                fileName: 'aggregator'
            },
            validationStatus: 'notValidated',
            aggregatorTransactionId: '776028360',
            predictedActions: [],
            providerAdditionalFields: []
        },
        {
            _id: 'stubbed',
            transactionType: 'CASH',
            transactionStatus: 'posted',
            datePosted: '2019-04-08T12:59:41.804Z',
            dateUserInitiated: '2019-04-08T12:59:41.804Z',
            dateFundsAvailable: null,
            transactionAmount: 0.02,
            transactionId: null,
            incrementedId: 2,
            correctionId: null,
            correctionAction: null,
            checkNum: '1',
            referenceNumber: 'ref 2',
            name: 'Cash',
            extendedName: null,
            payee: {
                payeeId: null,
                city: null,
                state: null,
                postalCode: null,
                country: null
            },
            coordinates: {
                lat: 0,
                long: 0
            },
            narrative1: 'Invoice 2',
            narrative2: 'Deposit',
            currency: 'USD',
            category: {
                topLevelCategory: 'Deposits',
                subCategory: 'INCOME',
                categoryId: 27
            },
            bankAccountId: '1',
            transactionIndex: 0,
            fileIdentificationNumber: 0,
            dateFileArrived: null,
            transactionHash: '',
            accountsPostings: [],
            transactionNarrative: '',
            internalProcessingStatus: null,
            raw: {
                transactionCode: 'aggregator',
                lineNumberFirst: 0,
                lineNumberLast: 0,
                lineContent: 'aggregator',
                fileName: 'aggregator'
            },
            validationStatus: 'notValidated',
            aggregatorTransactionId: '776028360',
            predictedActions: [],
            providerAdditionalFields: []
        }
    ];

    before(() => {
        sandbox = sinon.sandbox.create();

    });

    beforeEach(() => {
        clock = sinon.useFakeTimers(now);
    });

    afterEach(() => {
        sandbox.restore();
        clock.restore();
    });

    it('should build transactions', (done) => {


        const buildTransactions = BuildTransactions.Create();
        const transactions = buildTransactions.buildTransactionsforBucket('1', 1, 2);
        _.each(transactions, (transaction) => {
            transaction._id = 'stubbed';
        });
        should(transactions).eql(expectedTrx);
        done();
    });

    it('should build a bucket of transactions', (done) => {

        const expected = {
            _id: 'stubbed',
            region: "USA",
            bankAccountId: '1',
            startIncrementedId: 1,
            endIncrementedId: 2,
            numberOfTransactions: 2,
            transactions: expectedTrx,
            created: '2019-04-08T12:59:41.804Z',
            startDate: '2019-04-08T12:59:41.804Z',
            endDate: '2019-04-08T12:59:41.804Z'
        };

        const buildTransactions = BuildTransactions.Create();
        const bucket = buildTransactions.buildTransactionBucket('1', 1, 2);
        bucket._id = 'stubbed';
        _.each(bucket.transactions, (transaction) => {
            transaction._id = 'stubbed';
        });
        should(bucket).eql(expected);
        done();
    });

    it('should build 2 buckets, one full and on with 1 in', (done) => {

        const expected = [{
            _id: 'stubbed',
            region: "USA",
            bankAccountId: '1',
            startIncrementedId: 1,
            endIncrementedId: 100,
            numberOfTransactions: 100,
            transactions: [],
            created: '2019-04-08T12:59:41.804Z',
            startDate: '2019-04-08T12:59:41.804Z',
            endDate: '2019-04-08T12:59:41.804Z'
        },
        {
            _id: 'stubbed',
            region: "USA",
            bankAccountId: '1',
            startIncrementedId: 101,
            endIncrementedId: 101,
            numberOfTransactions: 1,
            transactions: [],
            created: '2019-04-08T12:59:41.804Z',
            startDate: '2019-04-08T12:59:41.804Z',
            endDate: '2019-04-08T12:59:41.804Z'
        }];


        const buildTransactions = BuildTransactions.Create();
        sandbox.stub(buildTransactions, 'buildTransactionsforBucket').returns([]);
        const buckets = buildTransactions.buildBuckets('1', 1, 101);
        _.each(buckets, (bucket) => {
            bucket._id = 'stubbed';
            bucket.transactions = [];
        });
        should(buckets).eql(expected);
        done();
    });
});
