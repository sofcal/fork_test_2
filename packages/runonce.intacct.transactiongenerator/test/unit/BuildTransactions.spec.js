const sinon = require('sinon');
const TransactionBuilder = require('../../lib/TransactionBuilder');
const should = require('should');
const uuid = require('uuid/v4');
const _ = require('underscore');

describe('runonce-intacct-transactiongenerator.BuildTransactions', () => {
    let sandbox;
    let clock;
    const now = new Date('2019-04-08T12:59:41.804Z');

    const bankAccount = {
        _id: '1',
        lastTransactionId: 0
    };

    const expectedTrx = [
        {
            _id: 'stubbed',
            transactionType: 'CREDIT',
            transactionStatus: 'posted',
            datePosted: '2019-04-08T12:59:41.804Z',
            dateUserInitiated: '2019-04-08T12:59:41.804Z',
            dateFundsAvailable: '2019-04-08T12:59:41.804Z',
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
            transactionHash: '968d97cdc169e4b94e414a2c7bb0cbf80f8b6383daffc059e3ee2451e32deb30',
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
            transactionType: 'CREDIT',
            transactionStatus: 'posted',
            datePosted: '2019-04-08T12:59:41.804Z',
            dateUserInitiated: '2019-04-08T12:59:41.804Z',
            dateFundsAvailable: '2019-04-08T12:59:41.804Z',
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
            transactionHash: 'd9a2afcd99460a612e49298b92f019218b27ffe5f236a0c4635d594fb75835c3',
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
        const transactionBuilder = TransactionBuilder.Create();
        const transactions = transactionBuilder.buildTransactions({ bankAccount, numTrxToCreate: 2 });
        _.each(transactions, (transaction) => {
            transaction._id = 'stubbed';
        });
        should(transactions).eql(expectedTrx);
        done();
    });
});
