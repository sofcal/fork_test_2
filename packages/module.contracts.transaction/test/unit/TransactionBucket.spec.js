'use strict';

const TransactionBucket = require('../../lib/TransactionBucket');
const Transaction = require('../../lib/Transaction');
const common = require('@sage/bc-common-resources');
const { StatusCodeError } = require('@sage/bc-common-statuscodeerror');
const utils = require('@sage/bc-services-validators');
const should = require('should');
const sinon = require('sinon');
const _ = require('underscore');

describe('@sage/bc-Transaction.TransactionBucket', function(){
    let sandbox;
    let data;

    function ConfirmError(error, errorCode, applicationCode) {
        error.should.be.an.instanceOf(StatusCodeError);
        error.statusCode.should.eql(errorCode);
        error.items[0].applicationCode.should.eql(applicationCode);
    }

    beforeEach(function(){
        sandbox = sinon.createSandbox();

        data = {
            uuid: 'dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc',
            region: 'region',
            bankAccountId: 'bankAccountID',
            startIncrementedId: 1,
            endIncrementedId: 10,
            startDate: '2019-01-01T00:01:00',
            endDate: '2019-01-02T23:59:59',
            numberOfTransactions: 2,
            transactions: []
        };
    });

    afterEach(function(){
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should create an instance of TransactionBucket', function(done){
            try{
                let transactionBucket = new TransactionBucket('some data');
                transactionBucket.should.be.instanceof(TransactionBucket);

                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should assign properties', function (done) {
            try {
                let transactionBucket = new TransactionBucket(data);
                should(JSON.parse(JSON.stringify(transactionBucket))).eql(data);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should not assign properties not on contract', function (done) {
            try {
                data.junk = 'junk';
                let transactionBucket = new TransactionBucket(data);
                should.not.exists(transactionBucket.junk);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should not assign properties not on contract', function (done) {
            try {
                data.junk = 'junk';
                let transactionBucket = new TransactionBucket(data);
                should.not.exists(transactionBucket.junk);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should create an array of new transactions', function (done) {
            try {
                data.transactions = [{
                    incrementedId: 1,
                    transactionType: 'CREDIT',
                    transactionStatus: 'ABCDEFGHIJKL',
                    datePosted: '2019-01-01T00:01:00',
                    dateUserInitiated: '2019-01-01T00:01:00',
                    dateFundsAvailable: '2019-01-01T00:01:00',
                    transactionAmount: 100,
                    transactionId: 'myFITID',
                    correctionId: 'myFITID',
                    correctionAction: 'REPLACE',
                    checkNum: 'myCheckNum',
                    referenceNumber: 'myReferenceNum',
                    name: 'myTransactionName',
                    extendedName: 'myExtendedName',
                    narrative1: 'myNarrative1',
                    narrative2: 'myNarrative2',
                    currency: 'myCurrency',
                    transactionIndex: 1,
                    fileIdentificationNumber: 'fileId',
                    raw: {
                        fileName: 'myS3FileName',
                        lineNumberFirst: 1,
                        lineNumberLast: 2,
                        lineContent: 'lineContent',
                        transactionCode: 'transactionCode',
                    },
                    validationStatus: 'Status',
                    providerAdditionalFields: [{
                        name: 'Extra 1',
                        value: '00001234'
                    }],
                    category: {
                        categoryId: 'catId',
                        standardIndustrialCode: 'industCode',
                        subCategory: 'subCat',
                        topLevelCategory: 'topLevel',
                        payeeAccountId: 'payeeAccountId',
                        payeeBankId: 'payeeBankId',
                        phoneNumber: 'phoneNumber',
                        postalCode: 'postalCode',
                        state: 'state'
                    },
                    payee: {
                        payeeAccountId: '1',
                        payeeBankId: '2',
                        payeeId: '3',
                        phoneNumber: '12345',
                        address1: 'add1',
                        address2: 'add2',
                        address3: 'add3',
                        city: 'city',
                        postalCode: 'postcode',
                        state: 'state',
                        country: 'country',

                    },
                    coordinates: {
                        lat: 0,
                        long: 0
                    },
                    accountsPostings: {},
                    actualAction: {},
                    predictedAction: []
                }];
                let transactionBucket = new TransactionBucket(data);

                should(transactionBucket.transactions).be.an.Array().of.length(data.transactions.length);
                should(transactionBucket.transactions[0]).be.instanceOf(Transaction);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('TransactionBucket.prototype.validate', function(){
        it('should call TransactionBucket.validate', function(done){
            sandbox.stub(TransactionBucket, 'validate');
            try {
                let transactionBucket = new TransactionBucket(data);
                transactionBucket.validate();

                TransactionBucket.validate.callCount.should.eql(1);
                TransactionBucket.validate.calledWithExactly(transactionBucket).should.eql(true);

                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('TransactionBucket.validate', function() {
        it('should throw an error if transactionBucket is undefined', function (done) {
            try {
                TransactionBucket.validate(undefined);

                done(new Error('should have thrown'));
            } catch (err) {

                err.should.be.instanceof(StatusCodeError);
                err.statusCode.should.eql(400);
                err.items[0].applicationCode.should.eql(common.services.common.InvalidType);

                done();
            }
        });

        it('should throw an error if transactionBucket is null', function(done){
            try{
                TransactionBucket.validate(null);

                done(new Error('should have thrown'));
            } catch(err){
                ConfirmError(err, err.statusCode, common.services.common.InvalidType);
                done();
            }
        });

        it('should throw an error if transactionBucket is not an instance of TransactionBucket', function(done){
            try{
                TransactionBucket.validate({});

                done(new Error('should have thrown'));
            } catch(err){
                ConfirmError(err, err.statusCode, common.services.common.InvalidType);
                done();
            }
        });

        it('should call validateContractObject', function(done){
            sandbox.stub(utils, 'validateContractObject');
            try {
                let transactionBucket = new TransactionBucket(data);
                transactionBucket.validate();

                utils.validateContractObject.callCount.should.eql(1);

                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('getDatePostedRange', function(){
        it('should return empty response if no transactions passed in', function(done){
            let testTransactions = [{}];
            let expected = { startDate: null, endDate: null }

            try {
                let actual = TransactionBucket.getDatePostedRange(testTransactions);
                should(actual).eql(expected);
                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should return the same date for start and end if only one transaction passed in', function(done){
            let testTransactions = [{
                transactionType: 'CREDIT',
                transactionStatus: 'ABCDEFGHIJKL',
                datePosted: new Date('2019-01-01T00:01:00'),
                dateUserInitiated: new Date('2019-01-01T00:01:00'),
                dateFundsAvailable: new Date(),
                transactionAmount: 100,
                transactionId: 'myFITID',
                correctionId: 'myFITID',
                correctionAction: 'REPLACE',
                checkNum: 'myCheckNum',
                referenceNumber: 'myReferenceNum',
                name: 'myTransactionName',
                extendedName: 'myExtendedName',
                narrative1: 'myNarrative1',
                narrative2: 'myNarrative2',
                currency: 'myCurrency',
                transactionIndex: 1,
                fileIdentificationNumber: 'fileId',
                raw: {
                    fileName: 'myS3FileName',
                    lineNumberFirst: 1,
                    lineNumberLast: 2,
                    lineContent: 'lineContent',
                    transactionCode: 'transactionCode',
                },
                validationStatus: 'Status',
                providerAdditionalFields: [{
                    name: 'Extra 1',
                    value: '00001234'
                }],
                category: {},
                payee: {},
                coordinates: {},
                accountsPostings: {},
                actualAction: {}
            }];
            let expected = { startDate: new Date('2019-01-01T00:01:00'), endDate: new Date('2019-01-01T00:01:00') }

            try {
                let actual = TransactionBucket.getDatePostedRange(testTransactions);
                should(actual).eql(expected);
                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should return different dates for start and end if two transactions passed (ordered) in', function(done){
            let testTransactions = [{
                transactionType: 'CREDIT',
                transactionStatus: 'ABCDEFGHIJKL',
                datePosted: new Date('2019-01-01T00:01:00'),
                dateUserInitiated: new Date('2019-01-01T00:01:00'),
                dateFundsAvailable: new Date(),
                transactionAmount: 100,
                transactionId: 'myFITID',
                correctionId: 'myFITID',
                correctionAction: 'REPLACE',
                checkNum: 'myCheckNum',
                referenceNumber: 'myReferenceNum',
                name: 'myTransactionName',
                extendedName: 'myExtendedName',
                narrative1: 'myNarrative1',
                narrative2: 'myNarrative2',
                currency: 'myCurrency',
                transactionIndex: 1,
                fileIdentificationNumber: 'fileId',
                raw: {
                    fileName: 'myS3FileName',
                    lineNumberFirst: 1,
                    lineNumberLast: 2,
                    lineContent: 'lineContent',
                    transactionCode: 'transactionCode',
                },
                validationStatus: 'Status',
                providerAdditionalFields: [{
                    name: 'Extra 1',
                    value: '00001234'
                }],
                category: {},
                payee: {},
                coordinates: {},
                accountsPostings: {},
                actualAction: {}
            },
            {
                transactionType: 'CREDIT',
                transactionStatus: 'ABCDEFGHIJKL',
                datePosted: new Date('2019-01-05T00:05:00'),
                dateUserInitiated: new Date('2019-01-05T00:05:00'),
                dateFundsAvailable: new Date(),
                transactionAmount: 100,
                transactionId: 'myFITID',
                correctionId: 'myFITID',
                correctionAction: 'REPLACE',
                checkNum: 'myCheckNum',
                referenceNumber: 'myReferenceNum',
                name: 'myTransactionName',
                extendedName: 'myExtendedName',
                narrative1: 'myNarrative1',
                narrative2: 'myNarrative2',
                currency: 'myCurrency',
                transactionIndex: 1,
                fileIdentificationNumber: 'fileId',
                raw: {
                    fileName: 'myS3FileName',
                    lineNumberFirst: 1,
                    lineNumberLast: 2,
                    lineContent: 'lineContent',
                    transactionCode: 'transactionCode',
                },
                validationStatus: 'Status',
                providerAdditionalFields: [{
                    name: 'Extra 1',
                    value: '00001234'
                }],
                category: {},
                payee: {},
                coordinates: {},
                accountsPostings: {},
                actualAction: {}
            }];
            let expected = { startDate: new Date('2019-01-01T00:01:00'), endDate: new Date('2019-01-05T00:05:00') }

            try {
                let actual = TransactionBucket.getDatePostedRange(testTransactions);
                should(actual).eql(expected);
                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should return different dates for start and end if multiple transactions (ordered) passed in', function(done){
            let testTransactions = [{
                transactionType: 'CREDIT',
                transactionStatus: 'ABCDEFGHIJKL',
                datePosted: new Date('2019-01-01T00:01:00'),
                dateUserInitiated: new Date('2019-01-01T00:01:00'),
                dateFundsAvailable: new Date(),
                transactionAmount: 100,
                transactionId: 'myFITID',
                correctionId: 'myFITID',
                correctionAction: 'REPLACE',
                checkNum: 'myCheckNum',
                referenceNumber: 'myReferenceNum',
                name: 'myTransactionName',
                extendedName: 'myExtendedName',
                narrative1: 'myNarrative1',
                narrative2: 'myNarrative2',
                currency: 'myCurrency',
                transactionIndex: 1,
                fileIdentificationNumber: 'fileId',
                raw: {
                    fileName: 'myS3FileName',
                    lineNumberFirst: 1,
                    lineNumberLast: 2,
                    lineContent: 'lineContent',
                    transactionCode: 'transactionCode',
                },
                validationStatus: 'Status',
                providerAdditionalFields: [{
                    name: 'Extra 1',
                    value: '00001234'
                }],
                category: {},
                payee: {},
                coordinates: {},
                accountsPostings: {},
                actualAction: {}
            },
            {
                transactionType: 'CREDIT',
                transactionStatus: 'ABCDEFGHIJKL',
                datePosted: new Date('2019-01-05T00:05:00'),
                dateUserInitiated: new Date('2019-01-05T00:05:00'),
                dateFundsAvailable: new Date(),
                transactionAmount: 100,
                transactionId: 'myFITID',
                correctionId: 'myFITID',
                correctionAction: 'REPLACE',
                checkNum: 'myCheckNum',
                referenceNumber: 'myReferenceNum',
                name: 'myTransactionName',
                extendedName: 'myExtendedName',
                narrative1: 'myNarrative1',
                narrative2: 'myNarrative2',
                currency: 'myCurrency',
                transactionIndex: 1,
                fileIdentificationNumber: 'fileId',
                raw: {
                    fileName: 'myS3FileName',
                    lineNumberFirst: 1,
                    lineNumberLast: 2,
                    lineContent: 'lineContent',
                    transactionCode: 'transactionCode',
                },
                validationStatus: 'Status',
                providerAdditionalFields: [{
                    name: 'Extra 1',
                    value: '00001234'
                }],
                category: {},
                payee: {},
                coordinates: {},
                accountsPostings: {},
                actualAction: {}
            },
            {
                transactionType: 'CREDIT',
                transactionStatus: 'ABCDEFGHIJKL',
                datePosted: new Date('2019-01-10T00:10:00'),
                dateUserInitiated: new Date('2019-01-10T00:10:00'),
                dateFundsAvailable: new Date(),
                transactionAmount: 100,
                transactionId: 'myFITID',
                correctionId: 'myFITID',
                correctionAction: 'REPLACE',
                checkNum: 'myCheckNum',
                referenceNumber: 'myReferenceNum',
                name: 'myTransactionName',
                extendedName: 'myExtendedName',
                narrative1: 'myNarrative1',
                narrative2: 'myNarrative2',
                currency: 'myCurrency',
                transactionIndex: 1,
                fileIdentificationNumber: 'fileId',
                raw: {
                    fileName: 'myS3FileName',
                    lineNumberFirst: 1,
                    lineNumberLast: 2,
                    lineContent: 'lineContent',
                    transactionCode: 'transactionCode',
                },
                validationStatus: 'Status',
                providerAdditionalFields: [{
                    name: 'Extra 1',
                    value: '00001234'
                }],
                category: {},
                payee: {},
                coordinates: {},
                accountsPostings: {},
                actualAction: {}
            }];
            let expected = { startDate: new Date('2019-01-01T00:01:00'), endDate: new Date('2019-01-10T00:10:00') }

            try {
                let actual = TransactionBucket.getDatePostedRange(testTransactions);
                should(actual).eql(expected);
                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should return different dates for start and end if multiple transactions (random order) passed in', function(done){
            let testTransactions = [{
                transactionType: 'CREDIT',
                transactionStatus: 'ABCDEFGHIJKL',
                datePosted: new Date('2019-01-10T00:10:00'),
                dateUserInitiated: new Date('2019-01-10T00:10:00'),
                dateFundsAvailable: new Date(),
                transactionAmount: 100,
                transactionId: 'myFITID',
                correctionId: 'myFITID',
                correctionAction: 'REPLACE',
                checkNum: 'myCheckNum',
                referenceNumber: 'myReferenceNum',
                name: 'myTransactionName',
                extendedName: 'myExtendedName',
                narrative1: 'myNarrative1',
                narrative2: 'myNarrative2',
                currency: 'myCurrency',
                transactionIndex: 1,
                fileIdentificationNumber: 'fileId',
                raw: {
                    fileName: 'myS3FileName',
                    lineNumberFirst: 1,
                    lineNumberLast: 2,
                    lineContent: 'lineContent',
                    transactionCode: 'transactionCode',
                },
                validationStatus: 'Status',
                providerAdditionalFields: [{
                    name: 'Extra 1',
                    value: '00001234'
                }],
                category: {},
                payee: {},
                coordinates: {},
                accountsPostings: {},
                actualAction: {}
            },
            {
                transactionType: 'CREDIT',
                transactionStatus: 'ABCDEFGHIJKL',
                datePosted: new Date('2019-01-01T00:01:00'),
                dateUserInitiated: new Date('2019-01-01T00:01:00'),
                dateFundsAvailable: new Date(),
                transactionAmount: 100,
                transactionId: 'myFITID',
                correctionId: 'myFITID',
                correctionAction: 'REPLACE',
                checkNum: 'myCheckNum',
                referenceNumber: 'myReferenceNum',
                name: 'myTransactionName',
                extendedName: 'myExtendedName',
                narrative1: 'myNarrative1',
                narrative2: 'myNarrative2',
                currency: 'myCurrency',
                transactionIndex: 1,
                fileIdentificationNumber: 'fileId',
                raw: {
                    fileName: 'myS3FileName',
                    lineNumberFirst: 1,
                    lineNumberLast: 2,
                    lineContent: 'lineContent',
                    transactionCode: 'transactionCode',
                },
                validationStatus: 'Status',
                providerAdditionalFields: [{
                    name: 'Extra 1',
                    value: '00001234'
                }],
                category: {},
                payee: {},
                coordinates: {},
                accountsPostings: {},
                actualAction: {}
            },
            {
                transactionType: 'CREDIT',
                transactionStatus: 'ABCDEFGHIJKL',
                datePosted: new Date('2019-01-05T00:05:00'),
                dateUserInitiated: new Date('2019-01-05T00:05:00'),
                dateFundsAvailable: new Date(),
                transactionAmount: 100,
                transactionId: 'myFITID',
                correctionId: 'myFITID',
                correctionAction: 'REPLACE',
                checkNum: 'myCheckNum',
                referenceNumber: 'myReferenceNum',
                name: 'myTransactionName',
                extendedName: 'myExtendedName',
                narrative1: 'myNarrative1',
                narrative2: 'myNarrative2',
                currency: 'myCurrency',
                transactionIndex: 1,
                fileIdentificationNumber: 'fileId',
                raw: {
                    fileName: 'myS3FileName',
                    lineNumberFirst: 1,
                    lineNumberLast: 2,
                    lineContent: 'lineContent',
                    transactionCode: 'transactionCode',
                },
                validationStatus: 'Status',
                providerAdditionalFields: [{
                    name: 'Extra 1',
                    value: '00001234'
                }],
                category: {},
                payee: {},
                coordinates: {},
                accountsPostings: {},
                actualAction: {}
            }];
            let expected = { startDate: new Date('2019-01-01T00:01:00'), endDate: new Date('2019-01-10T00:10:00') }

            try {
                let actual = TransactionBucket.getDatePostedRange(testTransactions);
                should(actual).eql(expected);
                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should use dateUserInitiated as startDate if checkInitiatedDate is true and initiated is less than posted', function(done){
            let testTransactions = [{
                transactionType: 'CREDIT',
                transactionStatus: 'ABCDEFGHIJKL',
                datePosted: new Date('2019-01-15T00:15:00'),
                dateUserInitiated: new Date('2019-01-02T00:02:00'),
                dateFundsAvailable: new Date(),
                transactionAmount: 100,
                transactionId: 'myFITID',
                correctionId: 'myFITID',
                correctionAction: 'REPLACE',
                checkNum: 'myCheckNum',
                referenceNumber: 'myReferenceNum',
                name: 'myTransactionName',
                extendedName: 'myExtendedName',
                narrative1: 'myNarrative1',
                narrative2: 'myNarrative2',
                currency: 'myCurrency',
                transactionIndex: 1,
                fileIdentificationNumber: 'fileId',
                raw: {
                    fileName: 'myS3FileName',
                    lineNumberFirst: 1,
                    lineNumberLast: 2,
                    lineContent: 'lineContent',
                    transactionCode: 'transactionCode',
                },
                validationStatus: 'Status',
                providerAdditionalFields: [{
                    name: 'Extra 1',
                    value: '00001234'
                }],
                category: {},
                payee: {},
                coordinates: {},
                accountsPostings: {},
                actualAction: {}
            }];
            let expected = { startDate: new Date('2019-01-02T00:02:00'), endDate: new Date('2019-01-15T00:15:00') }

            try {
                let actual = TransactionBucket.getDatePostedRange(testTransactions, true);
                should(actual).eql(expected);
                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should use dateUserInitiated as endDate if checkInitiatedDate is true and initiated is greater than posted', function(done){
            let testTransactions = [{
                transactionType: 'CREDIT',
                transactionStatus: 'ABCDEFGHIJKL',
                datePosted: new Date('2019-01-03T00:03:00'),
                dateUserInitiated: new Date('2019-01-20T00:20:00'),
                dateFundsAvailable: new Date(),
                transactionAmount: 100,
                transactionId: 'myFITID',
                correctionId: 'myFITID',
                correctionAction: 'REPLACE',
                checkNum: 'myCheckNum',
                referenceNumber: 'myReferenceNum',
                name: 'myTransactionName',
                extendedName: 'myExtendedName',
                narrative1: 'myNarrative1',
                narrative2: 'myNarrative2',
                currency: 'myCurrency',
                transactionIndex: 1,
                fileIdentificationNumber: 'fileId',
                raw: {
                    fileName: 'myS3FileName',
                    lineNumberFirst: 1,
                    lineNumberLast: 2,
                    lineContent: 'lineContent',
                    transactionCode: 'transactionCode',
                },
                validationStatus: 'Status',
                providerAdditionalFields: [{
                    name: 'Extra 1',
                    value: '00001234'
                }],
                category: {},
                payee: {},
                coordinates: {},
                accountsPostings: {},
                actualAction: {}
            }];
            let expected = { startDate: new Date('2019-01-03T00:03:00'), endDate: new Date('2019-01-20T00:20:00') }

            try {
                let actual = TransactionBucket.getDatePostedRange(testTransactions, true);
                should(actual).eql(expected);
                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should use dateInitiated for start/end if checkInitiatedDate is true and initiated is less/greater than posted', function(done){
            let testTransactions = [{
                transactionType: 'CREDIT',
                transactionStatus: 'ABCDEFGHIJKL',
                datePosted: new Date('2019-01-02T00:02:00'),
                dateUserInitiated: new Date('2019-01-10T00:10:00'),
                dateFundsAvailable: new Date(),
                transactionAmount: 100,
                transactionId: 'myFITID',
                correctionId: 'myFITID',
                correctionAction: 'REPLACE',
                checkNum: 'myCheckNum',
                referenceNumber: 'myReferenceNum',
                name: 'myTransactionName',
                extendedName: 'myExtendedName',
                narrative1: 'myNarrative1',
                narrative2: 'myNarrative2',
                currency: 'myCurrency',
                transactionIndex: 1,
                fileIdentificationNumber: 'fileId',
                raw: {
                    fileName: 'myS3FileName',
                    lineNumberFirst: 1,
                    lineNumberLast: 2,
                    lineContent: 'lineContent',
                    transactionCode: 'transactionCode',
                },
                validationStatus: 'Status',
                providerAdditionalFields: [{
                    name: 'Extra 1',
                    value: '00001234'
                }],
                category: {},
                payee: {},
                coordinates: {},
                accountsPostings: {},
                actualAction: {}
            },
            {
                transactionType: 'CREDIT',
                transactionStatus: 'ABCDEFGHIJKL',
                datePosted: new Date('2019-01-03T00:03:00'),
                dateUserInitiated: new Date('2019-01-01T00:01:00'),
                dateFundsAvailable: new Date(),
                transactionAmount: 100,
                transactionId: 'myFITID',
                correctionId: 'myFITID',
                correctionAction: 'REPLACE',
                checkNum: 'myCheckNum',
                referenceNumber: 'myReferenceNum',
                name: 'myTransactionName',
                extendedName: 'myExtendedName',
                narrative1: 'myNarrative1',
                narrative2: 'myNarrative2',
                currency: 'myCurrency',
                transactionIndex: 1,
                fileIdentificationNumber: 'fileId',
                raw: {
                    fileName: 'myS3FileName',
                    lineNumberFirst: 1,
                    lineNumberLast: 2,
                    lineContent: 'lineContent',
                    transactionCode: 'transactionCode',
                },
                validationStatus: 'Status',
                providerAdditionalFields: [{
                    name: 'Extra 1',
                    value: '00001234'
                }],
                category: {},
                payee: {},
                coordinates: {},
                accountsPostings: {},
                actualAction: {}
            }];
            let expected = { startDate: new Date('2019-01-01T00:01:00'), endDate: new Date('2019-01-10T00:10:00') }

            try {
                let actual = TransactionBucket.getDatePostedRange(testTransactions, true);
                should(actual).eql(expected);
                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

    });

});
