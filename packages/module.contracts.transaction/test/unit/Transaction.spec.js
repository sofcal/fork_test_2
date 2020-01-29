'use strict';

const Transaction = require('../../lib/Transaction');
const common = require('@sage/bc-common-resources');
const { StatusCodeError } = require('@sage/bc-common-statuscodeerror');
const should = require('should');
const sinon = require('sinon');
const _ = require('underscore');

describe('@sage/bc-Transaction.Transaction', function(){

    let sandbox;

    const a3CharacterString   = 'abc';
    const a4CharacterString   = 'abcd';
    const a9CharacterString   = 'abcdefghi';
    const a11CharacterString  = 'abcdefghijk';
    const a12CharacterString  = 'abcdefghijkl';
    const a13CharacterString  = 'abcdefghijklm';
    const a22CharacterString  = 'abcdefghijklmnopqrstuv';
    const a32CharacterString  = 'abcdefghijklmnopqrstuvwxyzabcdef';
    const a33CharacterString  = 'abcdefghijklmnopqrstuvwxyzabcdefg';
    const a50CharacterString  = 'x'.repeat(50);
    const a51CharacterString  = 'x'.repeat(51);
    const a100CharacterString = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuv';
    const a255CharacterString = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstu';
    const a256CharacterString = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuv';
    const a512CharacterString = a256CharacterString + a256CharacterString;
    const aUuid = '00000000-0000-1000-a000-000000000000';

    // A transaction with correct values
    function freshTransactionData() {
        return {
            transactionType: 'CREDIT',
            transactionStatus: 'ABCDEFGHIJKL',
            datePosted: new Date(),
            dateUserInitiated: new Date(),
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
                lineContent: a512CharacterString,
                transactionCode: 'transactionCode',
            },
            validationStatus: Transaction.validationStatus.notValidated,
            providerAdditionalFields: [{
                name: 'receipt',
                object: {
                    currency: 'GBR',
                    total: 1499,
                    receiptDate: new Date('2020-01-09T16:56:35.178Z'),
                    merchantName: 'Dominos Pizza'
                }
            }],
            category: freshTransactionCategory(),
            payee: freshTransactionPayee(),
            coordinates: freshTransactionPayeeCoordinates(),
            accountsPostings: freshTransactionCategoryAccountsPostings(),
            actualAction: freshTransactionAction()
        };
    }

    function freshTransactionCategoryAccountsPostings() {
        return [
            {
                createdBy: 'A Name',
                grossAmount: 30.00,
                netAmount: 20.00,
                taxAmount: 10.00,
                accountantNarrative: 'Some narrative string',
                postingInstructions: [
                    {
                        type: 'supplier',
                        code: 'SUPP1',
                        name: 'TESCO PLC',
                        status: 'Account on Hold',
                        value: 30.00
                    }
                ]
            },
            {
                createdBy: 'A Name',
                grossAmount: 20.00,
                netAmount: 15.00,
                taxAmount: 5.00,
                accountantNarrative: 'Another narrative string',
                postingInstructions: [
                    {
                        type: 'supplier',
                        code: 'SUPP1',
                        name: 'SAINSBURYS PLC',
                        status: 'Account on Hold',
                        value: 20.00
                    }
                ]
            }
        ];
    }

    function freshTransactionCategory() {
        return {
            'topLevelCategory': 'myTopCategory',
            'subCategory': 'mySubCategory',
            'categoryId': 123,
            'standardIndustrialCode': '123456'
        };
    }

    function freshTransactionPayee() {
        return {
            'payeeId': 'myPayeeId',
            'address1': 'myAddressLine1',
            'address2': 'myAddressLine2',
            'address3': 'myAddressLine3',
            'city': 'myCity',
            'state': 'mySta',
            'postalCode': 'myPostCode',
            'country': 'myC',
            'phoneNumber': 'myPhoneNumber',
            'payeeBankId': 'myBankId',
            'payeeAccountId': 'myBankAccountId'
        };
    }

    function freshTransactionPayeeCoordinates() {
        return {
            'lat': 123,
            'long': 321
        };
    }

    function freshTransactionAction() {
        return {
            'predictionId': 'ebd641b8-0109-42e3-87a8-9caaae283fd6',
            'action': {
                'actionType': 'create',
                'accountsPosting': {
                    'accountsTransactionId': '1',
                    'type': 'Direct Debit',
                    'reference': 'Rent',
                    'accountsPostings': [{
                        'grossAmount': 120,
                        'netAmount': 100,
                        'taxAmount': 20,
                        'accountantNarrative': 'bla',
                        'postingInstructions': [{
                            'type': 'customer',
                            'userDefinedTypeName': 'user defined',
                            'code': 'CUST1',
                            'name': 'Customer One',
                            'status': 'status',
                            'value': 100,
                            'description': 'desc'
                        }]
                    }]
                }
            }
        }
    }

    function ConfirmError(error, errorCode, applicationCode) {
        error.should.be.an.instanceOf(StatusCodeError);
        error.statusCode.should.eql(errorCode);
        error.items[0].applicationCode.should.eql(applicationCode);
    }

    beforeEach(function(){
        sandbox = sinon.createSandbox();
    });

    afterEach(function(){
        sandbox.restore();
    });

    describe('contract', function(){

        describe('constructor', function(){

            it('should create an instance of Transaction', function(done){
                try{
                    let transaction = new Transaction('some data');
                    transaction.should.be.instanceof(Transaction);

                    done();
                } catch(err){
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            describe('default values', function() {

                it('should default providerAdditionalFields to empty array', function() {
                    let transactionData = freshTransactionData();
                    delete transactionData.providerAdditionalFields;

                    let transaction = new Transaction(transactionData);

                    should(transaction.providerAdditionalFields).eql([]);
                });

                it('should default feedSource to auto', function() {
                    let transactionData = freshTransactionData();
                    let transaction = new Transaction(transactionData);

                    should(transaction.feedSource).eql(Transaction.feedSources.auto);
                });

                describe('coordinates', function() {

                    it('should default if coordinates is undefined', function(done) {

                        try{
                            let transactionData = freshTransactionData();
                            transactionData.coordinates = undefined;

                            let transaction = new Transaction(transactionData);

                            transaction.validate();

                            should(transaction.coordinates).not.be.undefined();
                            should(transaction.coordinates.lat).eql(0);
                            should(transaction.coordinates.long).eql(0);

                            done();
                        } catch(err){
                            done(err instanceof Error ? err : new Error(err));
                        }

                    });

                    it('should default if coordinates.long is null', function(done) {

                        try{
                            let transactionData = freshTransactionData();
                            transactionData.coordinates = {
                                lat: 0,
                                long: null
                            };

                            let transaction = new Transaction(transactionData);

                            transaction.validate();

                            should(transaction.coordinates).not.be.undefined();
                            should(transaction.coordinates.lat).eql(0);
                            should(transaction.coordinates.long).eql(0);

                            done();
                        } catch(err){
                            done(err instanceof Error ? err : new Error(err));
                        }

                    });

                    it('should default if coordinates.lat is null', function(done) {

                        try{
                            let transactionData = freshTransactionData();
                            transactionData.coordinates = {
                                lat: null,
                                long: 0
                            };

                            let transaction = new Transaction(transactionData);

                            transaction.validate();

                            should(transaction.coordinates).not.be.undefined();
                            should(transaction.coordinates.lat).eql(0);
                            should(transaction.coordinates.long).eql(0);

                            done();
                        } catch(err){
                            done(err instanceof Error ? err : new Error(err));
                        }

                    });

                    it('should default if coordinates.lat and coordinates.long is null', function(done) {

                        try{
                            let transactionData = freshTransactionData();
                            transactionData.coordinates = {
                                lat: null,
                                long: null
                            };

                            let transaction = new Transaction(transactionData);

                            transaction.validate();

                            should(transaction.coordinates).not.be.undefined();
                            should(transaction.coordinates.lat).eql(0);
                            should(transaction.coordinates.long).eql(0);

                            done();
                        } catch(err){
                            done(err instanceof Error ? err : new Error(err));
                        }

                    });

                });

                describe('transactionNarrative', function() {

                    it('should use source transactionNarrative unaltered', function(done) {
                        let testData = {
                            transactionNarrative: 'sourceNarrative',
                            narrative1: '       narrative 1   ',
                            narrative2: '  narrative #2  ',
                            name: 'wibble  ',
                            referenceNumber: '  1234',
                            extendedName: ' mr. LongName                              ',
                            payee: { payeeId: '     4444444    ', address1: 'ignore me'},
                            checkNum: '     11111       '
                        };
                        let expectedNarrative = 'sourceNarrative';

                        try{
                            let transaction = new Transaction(testData);
                            transaction.transactionNarrative.should.eql(expectedNarrative);

                            done();
                        } catch(err){
                            done(err instanceof Error ? err : new Error(err));
                        }
                    });

                    it('should build transactionNarrative and trim whitespace', function(done) {
                        let testData = {
                            narrative1: '       narrative 1   ',
                            narrative2: '  narrative #2  ',
                            name: 'wibble  ',
                            referenceNumber: '  1234',
                            extendedName: ' mr. LongName                              ',
                            payee: { payeeId: '     4444444    ', address1: 'ignore me'},
                            checkNum: '     11111       '
                        };
                        let expectedNarrative = 'narrative 1 narrative #2 wibble 1234 mr. LongName 4444444 11111';

                        try{
                            let transaction = new Transaction(testData);
                            transaction.transactionNarrative.should.eql(expectedNarrative);

                            done();
                        } catch(err){
                            done(err instanceof Error ? err : new Error(err));
                        }
                    });

                    it('should ignore missing values when building transactionNarrative', function(done) {
                        let testData = {
                            narrative2: '  narrative #2  ',
                            checkNum: '     11111       '
                        };
                        let expectedNarrative = 'narrative #2 11111';

                        try{
                            let transaction = new Transaction(testData);
                            transaction.transactionNarrative.should.eql(expectedNarrative);

                            done();
                        } catch(err){
                            done(err instanceof Error ? err : new Error(err));
                        }
                    });
                });
            });
        });

        describe('Transaction.prototype.validate', function(){

            it('should call Transaction.validate', function(done){
                sandbox.stub(Transaction, 'validate');
                try{
                    let transaction = new Transaction('some data');
                    transaction.validate();

                    Transaction.validate.callCount.should.eql(1);
                    Transaction.validate.calledWithExactly(transaction).should.eql(true);

                    done();
                } catch(err){
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });

        describe('Transaction.validate', function(){

            it('should throw an error if transaction is undefined', function(done){
                try{
                    Transaction.validate(undefined);

                    done(new Error('should have thrown'));
                } catch(err){

                    err.should.be.instanceof(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(common.services.common.InvalidType);

                    done();
                }
            });

            it('should throw an error if transaction is null', function(done){
                try{
                    Transaction.validate(null);

                    done(new Error('should have thrown'));
                } catch(err){
                    ConfirmError(err, err.statusCode, common.services.common.InvalidType);
                    done();
                }
            });

            it('should throw an error if transaction is not an instance of Transaction', function(done){
                try{
                    Transaction.validate({});

                    done(new Error('should have thrown'));
                } catch(err){
                    ConfirmError(err, err.statusCode, common.services.common.InvalidType);
                    done();
                }
            });

            describe('Transaction.validate properties', function(){

                let newTransaction;

                beforeEach(function(){
                    newTransaction = new Transaction(freshTransactionData());
                });


                let tests = [{
                    target: 'uuid', tests: [
                        { it: 'should not throw if uuid is undefined', value: undefined, error: false },
                        { it: 'should not throw if uuid is null', value: null, error: false },
                        { it: 'should throw if uuid is an empty string', value: '', error: true },
                        { it: 'should throw if uuid is not a valid uuid', value: 'not-a-uuid', error: true },
                        { it: 'should not throw if uuid is a valid uuid', value: aUuid, error: false },
                        { it: 'should throw if uuid is a number', value: 9, error: true },
                        { it: 'should throw if uuid is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidUuid, errorNumber: 400
                }, {
                    target: 'transactionType', tests: [
                        { it: 'should throw if transactionType is undefined', value: undefined, error: true },
                        { it: 'should throw if transactionType is null', value: null, error: true },
                        { it: 'should throw if transactionType is boolean true', value: true, error: true },
                        { it: 'should throw if transactionType is boolean false', value: false, error: true },
                        { it: 'should throw if transactionType is a zero length string', value: '', error: true },
                        { it: 'should throw if transactionType is a number', value: 6, error: true },
                        { it: 'should throw if transactionType is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidTransactionType, errorNumber: 400
                }, {
                    target: 'transactionStatus', tests: [
                        { it: 'should throw if transactionStatus is undefined', value: undefined, error: true },
                        { it: 'should throw if transactionStatus is null', value: null, error: true },
                        { it: 'should throw if transactionStatus is boolean true', value: true, error: true },
                        { it: 'should throw if transactionStatus is boolean false', value: false, error: true },
                        { it: 'should throw if transactionStatus is a zero length string', value: '', error: true },
                        { it: 'should not throw if transactionStatus is a 12 character string', value: a12CharacterString, error: false },
                        { it: 'should throw if transactionStatus is a 13 character string', value: a13CharacterString, error: true },
                        { it: 'should throw if transactionStatus is a number', value: 6, error: true },
                        { it: 'should throw if transactionStatus is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidTransactionStatus, errorNumber: 400
                }, {
                    target: 'datePosted', tests: [
                        { it: 'should not throw if datePosted is undefined', value: undefined, error: false },
                        { it: 'should not throw if datePosted is null', value: null, error: false },
                        { it: 'should throw if datePosted is boolean true', value: true, error: true },
                        { it: 'should throw if datePosted is boolean false', value: false, error: true },
                        { it: 'should throw if datePosted is a zero length string', value: '', error: true },
                        { it: 'should not throw if datePosted is a valid date', value: new Date(), error: false },
                        { it: 'should throw if datePosted is a string', value: 'WrongDate', error: true },
                        { it: 'should throw if datePosted is a number', value: 6, error: true },
                        { it: 'should throw if datePosted is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidDatePosted, errorNumber: 400
                }, {
                    target: 'dateUserInitiated', tests: [
                        { it: 'should not throw if dateUserInitiated is undefined', value: undefined, error: false },
                        { it: 'should not throw if dateUserInitiated is null', value: null, error: false },
                        { it: 'should throw if dateUserInitiated is boolean true', value: true, error: true },
                        { it: 'should throw if dateUserInitiated is boolean false', value: false, error: true },
                        { it: 'should throw if dateUserInitiated is a zero length string', value: '', error: true },
                        { it: 'should not throw if dateUserInitiated is a valid date', value: new Date(), error: false },
                        { it: 'should throw if dateUserInitiated is a string', value: 'WrongDate', error: true },
                        { it: 'should throw if dateUserInitiated is a number', value: 6, error: true },
                        { it: 'should throw if dateUserInitiated is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidDateUserInitiated, errorNumber: 400
                }, {
                    target: 'dateFundsAvailable', tests: [
                        { it: 'should not throw if dateFundsAvailable is undefined', value: undefined, error: false },
                        { it: 'should not throw if dateFundsAvailable is null', value: null, error: false },
                        { it: 'should throw if dateFundsAvailable is boolean true', value: true, error: true },
                        { it: 'should throw if dateFundsAvailable is boolean false', value: false, error: true },
                        { it: 'should throw if dateFundsAvailable is a zero length string', value: '', error: true },
                        { it: 'should not throw if dateFundsAvailable is a valid date', value: new Date(), error: false },
                        { it: 'should throw if dateFundsAvailable is a string', value: 'WrongDate', error: true },
                        { it: 'should throw if dateFundsAvailable is a number', value: 6, error: true },
                        { it: 'should throw if dateFundsAvailable is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidDateFundsAvailable, errorNumber: 400
                }, {
                    target: 'transactionAmount', tests: [
                        { it: 'should throw if transactionAmount is undefined', value: undefined, error: true },
                        { it: 'should throw if transactionAmount is null', value: null, error: true },
                        { it: 'should throw if transactionAmount is boolean true', value: true, error: true },
                        { it: 'should throw if transactionAmount is boolean false', value: false, error: true },
                        { it: 'should throw if transactionAmount is a zero length string', value: '', error: true },
                        { it: 'should throw if transactionAmount is NaN', value: NaN, error: true },
                        { it: 'should not throw if transactionAmount is a valid number', value: 100, error: false },
                        { it: 'should throw if transactionAmount is a string', value: 'WrongNumber', error: true },
                        { it: 'should throw if transactionAmount is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidTransactionAmount, errorNumber: 400
                }, {
                    target: 'transactionId', tests: [
                        { it: 'should not throw if transactionId is undefined', value: undefined, error: false },
                        { it: 'should not throw if transactionId is null', value: null, error: false },
                        { it: 'should throw if transactionId is boolean true', value: true, error: true },
                        { it: 'should throw if transactionId is boolean false', value: false, error: true },
                        { it: 'should throw if transactionId is a zero length string', value: '', error: true },
                        { it: 'should not throw if transactionId is a 255 character string', value: a255CharacterString, error: false },
                        { it: 'should throw if transactionId is a 256 character string', value: a256CharacterString, error: true },
                        { it: 'should throw if transactionId is a number', value: 6, error: true },
                        { it: 'should throw if transactionId is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidTransactionId, errorNumber: 400
                }, {
                    target: 'correctionId', tests: [
                        { it: 'should not throw if correctionId is undefined', value: undefined, error: false },
                        { it: 'should not throw if correctionId is null', value: null, error: false },
                        { it: 'should throw if correctionId is boolean true', value: true, error: true },
                        { it: 'should throw if correctionId is boolean false', value: false, error: true },
                        { it: 'should not throw if correctionId is a zero length string', value: '', error: false },
                        { it: 'should not throw if correctionId is a 255 character string', value: a255CharacterString, error: false },
                        { it: 'should throw if correctionId is a 256 character string', value: a256CharacterString, error: true },
                        { it: 'should throw if correctionId is a number', value: 6, error: true },
                        { it: 'should throw if correctionId is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidCorrectionId, errorNumber: 400
                }, {
                    target: 'correctionAction', tests: [
                        { it: 'should not throw if correctionAction is undefined', value: undefined, error: false },
                        { it: 'should not throw if correctionAction is null', value: null, error: false },
                        { it: 'should throw if correctionAction is boolean true', value: true, error: true },
                        { it: 'should throw if correctionAction is boolean false', value: false, error: true },
                        { it: 'should throw if correctionAction is a zero length string', value: '', error: true },
                        { it: 'should throw if correctionAction is a number', value: 6, error: true },
                        { it: 'should throw if correctionAction is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidCorrectionAction, errorNumber: 400
                }, {
                    target: 'checkNum', tests: [
                        { it: 'should not throw if checkNum is undefined', value: undefined, error: false },
                        { it: 'should not throw if checkNum is null', value: null, error: false },
                        { it: 'should throw if checkNum is boolean true', value: true, error: true },
                        { it: 'should throw if checkNum is boolean false', value: false, error: true },
                        { it: 'should not throw if checkNum is a zero length string', value: '', error: false },
                        { it: 'should not throw if checkNum is a string', value: a12CharacterString, error: false },
                        { it: 'should throw if checkNum is a number', value: 6, error: true },
                        { it: 'should throw if checkNum is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidCheckNum, errorNumber: 400
                }, {
                    target: 'referenceNumber', tests: [
                        { it: 'should not throw if referenceNumber is undefined', value: undefined, error: false },
                        { it: 'should not throw if referenceNumber is null', value: null, error: false },
                        { it: 'should throw if referenceNumber is boolean true', value: true, error: true },
                        { it: 'should throw if referenceNumber is boolean false', value: false, error: true },
                        { it: 'should not throw if referenceNumber is a zero length string', value: '', error: false },
                        { it: 'should not throw if referenceNumber is a string', value: a32CharacterString, error: false },
                        { it: 'should throw if referenceNumber is a number', value: 6, error: true },
                        { it: 'should throw if referenceNumber is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidReferenceNumber, errorNumber: 400
                }, {
                    target: 'name', tests: [
                        { it: 'should not throw if name is undefined', value: undefined, error: false },
                        { it: 'should not throw if name is null', value: null, error: false },
                        { it: 'should throw if name is boolean true', value: true, error: true },
                        { it: 'should throw if name is boolean false', value: false, error: true },
                        { it: 'should not throw if name is a zero length string', value: '', error: false },
                        { it: 'should not throw if name is a string', value: a512CharacterString, error: false },
                        { it: 'should throw if name is a number', value: 6, error: true },
                        { it: 'should throw if name is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidName, errorNumber: 400
                }, {
                    target: 'extendedName', tests: [
                        { it: 'should not throw if extendedName is undefined', value: undefined, error: false },
                        { it: 'should not throw if extendedName is null', value: null, error: false },
                        { it: 'should throw if extendedName is boolean true', value: true, error: true },
                        { it: 'should throw if extendedName is boolean false', value: false, error: true },
                        { it: 'should not throw if extendedName is a zero length string', value: '', error: false },
                        { it: 'should not throw if extendedName is a string', value: a100CharacterString, error: false },
                        { it: 'should throw if extendedName is a number', value: 6, error: true },
                        { it: 'should throw if extendedName is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidExtendedName, errorNumber: 400
                }, {
                    target: 'narrative1', tests: [
                        { it: 'should not throw if narrative1 is undefined', value: undefined, error: false },
                        { it: 'should not throw if narrative1 is null', value: null, error: false },
                        { it: 'should throw if narrative1 is boolean true', value: true, error: true },
                        { it: 'should throw if narrative1 is boolean false', value: false, error: true },
                        { it: 'should not throw if narrative1 is a zero length string', value: '', error: false },
                        { it: 'should not throw if narrative1 is a string', value: a32CharacterString, error: false },
                        { it: 'should throw if narrative1 is a number', value: 6, error: true },
                        { it: 'should throw if narrative1 is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidNarrative1, errorNumber: 400
                }, {
                    target: 'narrative2', tests: [
                        { it: 'should not throw if narrative2 is undefined', value: undefined, error: false },
                        { it: 'should not throw if narrative2 is null', value: null, error: false },
                        { it: 'should throw if narrative2 is boolean true', value: true, error: true },
                        { it: 'should throw if narrative2 is boolean false', value: false, error: true },
                        { it: 'should not throw if narrative2 is a zero length string', value: '', error: false },
                        { it: 'should not throw if narrative2 is a string', value: a32CharacterString, error: false },
                        { it: 'should throw if narrative2 is a number', value: 6, error: true },
                        { it: 'should throw if narrative2 is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidNarrative2, errorNumber: 400
                }, {
                    target: 'currency', tests: [
                        { it: 'should not throw if currency is undefined', value: undefined, error: false },
                        { it: 'should not throw if currency is null', value: null, error: false },
                        { it: 'should throw if currency is boolean true', value: true, error: true },
                        { it: 'should throw if currency is boolean false', value: false, error: true },
                        { it: 'should not throw if currency is a zero length string', value: '', error: false },
                        { it: 'should not throw if currency is a valid character string', value: 'myString', error: false },
                        { it: 'should throw if currency is a number', value: 6, error: true },
                        { it: 'should throw if currency is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidCurrency, errorNumber: 400
                }, {
                    target: 'category', tests: [
                        { it: 'should not throw if category is undefined', value: undefined, error: false },
                        { it: 'should not throw if category is null', value: null, error: false },
                        { it: 'should not throw if category is an object', value: {}, error: false },
                    ]
                    , errorCode: common.services.transaction.category.InvalidCategory, errorNumber: 400
                }, {
                    target: 'payee', tests: [
                        { it: 'should not throw if payee is undefined', value: undefined, error: false },
                        { it: 'should not throw if payee is null', value: null, error: false },
                        { it: 'should not throw if payee is an object', value: {}, error: false },
                    ]
                    , errorCode: common.services.transaction.payee.InvalidPayee, errorNumber: 400
                }, {
                    target: 'coordinates', tests: [
                        { it: 'should not throw if coordinates is an object', value: { lat: 1, long: 1 }, error: false },
                        { it: 'should throw if coordinates is undefined', value: undefined, error: true },
                        { it: 'should throw if coordinates is null', value: null, error: true },
                        { it: 'should throw if coordinates is an empty string', value: '', error: true },
                        { it: 'should throw if coordinates is a number', value: 9, error: true },
                        { it: 'should throw if coordinates is a function', value: function(){}, error: true },
                        { it: 'should throw if coordinates is an array', value: ['', ''], error: true },
                        { it: 'should throw if coordinates is boolean true', value: true, error: true },
                        { it: 'should throw if coordinates is boolean false', value: false, error: true }
                    ]
                    , errorCode: common.services.transaction.coordinates.InvalidCoordinates, errorNumber: 400
                }, {
                    target: 'internalProcessingStatus', tests: [
                        {it: 'should not throw if internalProcessingStatus is undefined', value: undefined, error: false},
                        {it: 'should not throw if internalProcessingStatus is null', value: null, error: false},
                        {it: 'should throw if internalProcessingStatus is boolean true', value: true, error: true},
                        {it: 'should not throw if internalProcessingStatus \'releasing\'', value: 'releasing', error: false},
                        {it: 'should throw if internalProcessingStatus is invalid string', value: 'string', error: true},
                        {it: 'should throw if internalProcessingStatus is a number', value: 100, error: true},
                        {it: 'should throw if internalProcessingStatus is an object', value: {}, error: true}
                    ]
                    , errorCode: common.services.transaction.InvalidInternalProcessingStatus, errorNumber: 400
                }, {
                    target: 'feedSource', tests: [
                        { it: 'should not throw if feedSource is undefined', value: undefined, error: false },
                        { it: 'should not throw if feedSource is null', value: null, error: false },
                        { it: 'should not throw if feedSource is a valid string', value: Transaction.feedSources.manual, error: false },
                        { it: 'should throw if feedSource is invalid string', value: 'string', error: true },
                        { it: 'should throw if feedSource is a boolean', value: true, error: true },
                        { it: 'should throw if feedSource is a number', value: 100, error: true },
                        { it: 'should throw if feedSource is a date', value: new Date(), error: true },
                        { it: 'should throw if feedSource is an object', value: {}, error: true }
                    ]
                }, {
                    target: 'raw', tests: [
                        {it: 'should not throw if raw is undefined', value: undefined, error: false},
                        {it: 'should not throw if raw is null', value: null, error: false},
                        {it: 'should throw if raw is boolean true', value: true, error: true},
                        {it: 'should throw if raw is a string', value: 'string', error: true},
                        {it: 'should throw if raw is a number', value: 9, error: true},

                        {it: 'should throw if raw is an object, but fileName is undefined', value: {
                                fileName: undefined, lineNumberFirst: 0, lineNumberLast: 1, lineContent: 'content', transactionCode: '001'
                            }, error: true, skipParamAssert: true},
                        {it: 'should throw if raw is an object, but fileName is null', value: {
                                fileName: null, lineNumberFirst: 0, lineNumberLast: 1, lineContent: 'content', transactionCode: '001'
                            }, error: true, skipParamAssert: true},
                        {it: 'should throw if raw is an object, but fileName is a number', value: {
                                fileName: 1, lineNumberFirst: 0, lineNumberLast: 1, lineContent: 'content', transactionCode: '001'
                            }, error: true, skipParamAssert: true},
                        {it: 'should throw if raw is an object, but fileName is an object', value: {
                                fileName: {}, lineNumberFirst: 0, lineNumberLast: 1, lineContent: 'content', transactionCode: '001'
                            }, error: true, skipParamAssert: true},

                        {it: 'should throw if raw is an object, but lineNumberFirst is undefined', value: {
                                fileName: 'file_name', lineNumberFirst: undefined, lineNumberLast: 1, lineContent: 'content', transactionCode: '001'
                            }, error: true, skipParamAssert: true},
                        {it: 'should throw if raw is an object, but lineNumberFirst is null', value: {
                                fileName: 'file_name', lineNumberFirst: null, lineNumberLast: 1, lineContent: 'content', transactionCode: '001'
                            }, error: true, skipParamAssert: true},
                        {it: 'should throw if raw is an object, but lineNumberFirst is a string', value: {
                                fileName: 'file_name', lineNumberFirst: 'string', lineNumberLast: 1, lineContent: 'content', transactionCode: '001'
                            }, error: true, skipParamAssert: true},
                        {it: 'should throw if raw is an object, but lineNumberFirst is an object', value: {
                                fileName: 'file_name', lineNumberFirst: {}, lineNumberLast: 1, lineContent: 'content', transactionCode: '001'
                            }, error: true, skipParamAssert: true},

                        {it: 'should throw if raw is an object, but lineNumberLast is undefined', value: {
                                fileName: 'file_name', lineNumberFirst: 0, lineNumberLast: undefined, lineContent: 'content', transactionCode: '001'
                            }, error: true, skipParamAssert: true},
                        {it: 'should throw if raw is an object, but lineNumberLast is null', value: {
                                fileName: 'file_name', lineNumberFirst: 0, lineNumberLast: null, lineContent: 'content', transactionCode: '001'
                            }, error: true, skipParamAssert: true},
                        {it: 'should throw if raw is an object, but lineNumberLast is a string', value: {
                                fileName: 'file_name', lineNumberFirst: 0, lineNumberLast: '1', lineContent: 'content', transactionCode: '001'
                            }, error: true, skipParamAssert: true},
                        {it: 'should throw if raw is an object, but lineNumberLast is an object', value: {
                                fileName: 'file_name', lineNumberFirst: 0, lineNumberLast: {}, lineContent: 'content', transactionCode: '001'
                            }, error: true, skipParamAssert: true},

                        {it: 'should throw if raw is an object, but lineContent is undefined', value: {
                                fileName: 'file_name', lineNumberFirst: 0, lineNumberLast: 1, lineContent: undefined, transactionCode: '001'
                            }, error: true, skipParamAssert: true},
                        {it: 'should throw if raw is an object, but lineContent is null', value: {
                                fileName: 'file_name', lineNumberFirst: 0, lineNumberLast: 1, lineContent: null, transactionCode: '001'
                            }, error: true, skipParamAssert: true},
                        {it: 'should throw if raw is an object, but lineContent is a number', value: {
                                fileName: 'file_name', lineNumberFirst: 0, lineNumberLast: 1, lineContent: 9, transactionCode: '001'
                            }, error: true, skipParamAssert: true},
                        {it: 'should throw if raw is an object, but lineContent is an object', value: {
                                fileName: 'file_name', lineNumberFirst: 0, lineNumberLast: 1, lineContent: {}, transactionCode: '001'
                            }, error: true, skipParamAssert: true},

                        {it: 'should throw if raw is an object, but transactionCode is undefined', value: {
                                fileName: 'file_name', lineNumberFirst: 0, lineNumberLast: 1, lineContent: 'content', transactionCode: undefined
                            }, error: true, skipParamAssert: true},
                        {it: 'should throw if raw is an object, but transactionCode is null', value: {
                                fileName: 'file_name', lineNumberFirst: 0, lineNumberLast: 1, lineContent: 'content', transactionCode: null
                            }, error: true, skipParamAssert: true},
                        {it: 'should throw if raw is an object, but transactionCode is a number', value: {
                                fileName: 'file_name', lineNumberFirst: 0, lineNumberLast: 1, lineContent: 'content', transactionCode: 1
                            }, error: true, skipParamAssert: true},
                        {it: 'should throw if raw is an object, but transactionCode is an object', value: {
                                fileName: 'file_name', lineNumberFirst: 0, lineNumberLast: 1, lineContent: 'content', transactionCode: {}
                            }, error: true, skipParamAssert: true},
                    ]
                    , errorCode: common.services.transaction.Invalids3FileName, errorNumber: 400
                }, {
                    target: 'providerAdditionalFields', tests: [
                        { it: 'should not throw if providerAdditionalFields is an empty array', value: [], error: false },
                        { it: 'should throw if providerAdditionalFields is undefined', value: undefined, error: true },
                        { it: 'should throw if providerAdditionalFields is null', value: null, error: true },
                        { it: 'should throw if providerAdditionalFields is an object', value: {}, error: true },
                        { it: 'should throw if providerAdditionalFields is a string', value: 'name', error: true },
                        { it: 'should throw if providerAdditionalFields is a number', value: 9, error: true },
                        { it: 'should throw if providerAdditionalFields is a boolean', value: true, error: true }
                    ]
                }, {
                    target: 'actualAction', tests: [
                        { it: 'should not throw if actualAction is undefined', value: undefined, error: false },
                        { it: 'should not throw if actualAction is null', value: null, error: false },
                        { it: 'should throw if actualAction is an empty string', value: '', error: true },
                        { it: 'should throw if actualAction is a number', value: 9, error: true },
                        { it: 'should throw if actualAction is a function', value: function(){}, error: true },
                        { it: 'should throw if actualAction is an array', value: ['', ''], error: true }
                    ]
                    , errorCode: common.services.transaction.InvalidActualAction, errorNumber: 400
                }];

                let categoryTests = [{
                    target: 'topLevelCategory', tests: [
                        { it: 'should not throw if topLevelCategory is undefined', value: undefined, error: false },
                        { it: 'should not throw if topLevelCategory is null', value: null, error: false },
                        { it: 'should throw if topLevelCategory is boolean true', value: true, error: true },
                        { it: 'should throw if topLevelCategory is boolean false', value: false, error: true },
                        { it: 'should not throw if topLevelCategory is a zero length string', value: '', error: false },
                        { it: 'should not throw if topLevelCategory is a valid character string', value: 'myString', error: false },
                        { it: 'should throw if topLevelCategory is a number', value: 6, error: true },
                        { it: 'should throw if topLevelCategory is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.category.InvalidTopLevelCategory, errorNumber: 400
                }, {
                    target: 'subCategory', tests: [
                        { it: 'should not throw if subCategory is undefined', value: undefined, error: false },
                        { it: 'should not throw if subCategory is null', value: null, error: false },
                        { it: 'should throw if subCategory is boolean true', value: true, error: true },
                        { it: 'should throw if subCategory is boolean false', value: false, error: true },
                        { it: 'should not throw if subCategory is a zero length string', value: '', error: false },
                        { it: 'should not throw if subCategory is a valid character string', value: 'myString', error: false },
                        { it: 'should throw if subCategory is a number', value: 6, error: true },
                        { it: 'should throw if subCategory is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.category.InvalidSubCategory, errorNumber: 400
                }, {
                    target: 'categoryId', tests: [
                        {it: 'should not throw if categoryId is undefined', value: undefined, error: false},
                        {it: 'should not throw if categoryId is null', value: null, error: false},
                        {it: 'should throw if categoryId is boolean true', value: true, error: true},
                        {it: 'should throw if categoryId is boolean false', value: false, error: true},
                        {it: 'should throw if categoryId is a zero length string', value: '', error: true},
                        {it: 'should throw if categoryId is NaN', value: NaN, error: true},
                        {it: 'should not throw if categoryId is a valid number', value: 100, error: false},
                        {it: 'should throw if categoryId is a string', value: 'WrongNumber', error: true},
                        {it: 'should throw if categoryId is an object', value: {}, error: true}
                    ]
                    , errorCode: common.services.transaction.category.InvalidId, errorNumber: 400
                }, {
                    target: 'standardIndustrialCode', tests: [
                        {it: 'should not throw if standardIndustrialCode is undefined', value: undefined, error: false},
                        {it: 'should not throw if standardIndustrialCode is null', value: null, error: false},
                        {it: 'should throw if standardIndustrialCode is boolean true', value: true, error: true},
                        {it: 'should throw if standardIndustrialCode is boolean false', value: false, error: true},
                        {it: 'should throw if standardIndustrialCode is a zero length string', value: '', error: true},
                        {it: 'should throw if standardIndustrialCode is NaN', value: NaN, error: true},
                        {it: 'should throw if standardIndustrialCode is a valid number', value: 100, error: true},
                        {it: 'should not throw if standardIndustrialCode is a string', value: '1234', error: false},
                        {it: 'should throw if standardIndustrialCode is an empty string', value: '', error: true},
                        {it: 'should throw if standardIndustrialCode is an object', value: {}, error: true}
                    ]
                    , errorCode: common.services.transaction.category.InvalidIndustrialCode, errorNumber: 400
                }];

                let payeeTests = [{
                    target: 'payeeId', tests: [
                        { it: 'should not throw if payeeId is undefined', value: undefined, error: false },
                        { it: 'should not throw if payeeId is null', value: null, error: false },
                        { it: 'should throw if payeeId is boolean true', value: true, error: true },
                        { it: 'should throw if payeeId is boolean false', value: false, error: true },
                        { it: 'should not throw if payeeId is a zero length string', value: '', error: false },
                        { it: 'should not throw if payeeId is a string', value: a12CharacterString, error: false },
                        { it: 'should throw if payeeId is a number', value: 6, error: true },
                        { it: 'should throw if payeeId is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.payee.InvalidId, errorNumber: 400
                }, {
                    target: 'address1', tests: [
                        { it: 'should not throw if address1 is undefined', value: undefined, error: false },
                        { it: 'should not throw if address1 is null', value: null, error: false },
                        { it: 'should throw if address1 is boolean true', value: true, error: true },
                        { it: 'should throw if address1 is boolean false', value: false, error: true },
                        { it: 'should not throw if address1 is a zero length string', value: '', error: false },
                        { it: 'should not throw if address1 is a string', value: a32CharacterString, error: false },
                        { it: 'should throw if address1 is a number', value: 6, error: true },
                        { it: 'should throw if address1 is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.payee.InvalidAddressLine1, errorNumber: 400
                }, {
                    target: 'address2', tests: [
                        { it: 'should not throw if address2 is undefined', value: undefined, error: false },
                        { it: 'should not throw if address2 is null', value: null, error: false },
                        { it: 'should throw if address2 is boolean true', value: true, error: true },
                        { it: 'should throw if address2 is boolean false', value: false, error: true },
                        { it: 'should not throw if address2 is a zero length string', value: '', error: false },
                        { it: 'should not throw if address2 is a string', value: a32CharacterString, error: false },
                        { it: 'should throw if address2 is a number', value: 6, error: true },
                        { it: 'should throw if address2 is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.payee.InvalidAddressLine2, errorNumber: 400
                }, {
                    target: 'address3', tests: [
                        { it: 'should not throw if address3 is undefined', value: undefined, error: false },
                        { it: 'should not throw if address3 is null', value: null, error: false },
                        { it: 'should throw if address3 is boolean true', value: true, error: true },
                        { it: 'should throw if address3 is boolean false', value: false, error: true },
                        { it: 'should not throw if address3 is a zero length string', value: '', error: false },
                        { it: 'should not throw if address3 is a string', value: a32CharacterString, error: false },
                        { it: 'should throw if address3 is a number', value: 6, error: true },
                        { it: 'should throw if address3 is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.payee.InvalidAddressLine3, errorNumber: 400
                }, {
                    target: 'city', tests: [
                        { it: 'should not throw if city is undefined', value: undefined, error: false },
                        { it: 'should not throw if city is null', value: null, error: false },
                        { it: 'should throw if city is boolean true', value: true, error: true },
                        { it: 'should throw if city is boolean false', value: false, error: true },
                        { it: 'should not throw if city is a zero length string', value: '', error: false },
                        { it: 'should not throw if city is a string', value: a32CharacterString, error: false },
                        { it: 'should throw if city is a number', value: 6, error: true },
                        { it: 'should throw if city is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.payee.InvalidCity, errorNumber: 400
                }, {
                    target: 'state', tests: [
                        { it: 'should not throw if state is undefined', value: undefined, error: false },
                        { it: 'should not throw if state is null', value: null, error: false },
                        { it: 'should throw if state is boolean true', value: true, error: true },
                        { it: 'should throw if state is boolean false', value: false, error: true },
                        { it: 'should not throw if state is a zero length string', value: '', error: false },
                        { it: 'should not throw if state is a string', value: a33CharacterString, error: false },
                        { it: 'should throw if state is a number', value: 6, error: true },
                        { it: 'should throw if state is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.payee.InvalidState, errorNumber: 400
                }, {
                    target: 'postalCode', tests: [
                        { it: 'should not throw if postalCode is undefined', value: undefined, error: false },
                        { it: 'should not throw if postalCode is null', value: null, error: false },
                        { it: 'should throw if postalCode is boolean true', value: true, error: true },
                        { it: 'should throw if postalCode is boolean false', value: false, error: true },
                        { it: 'should not throw if postalCode is a zero length string', value: '', error: false },
                        { it: 'should not throw if postalCode is a string', value: a11CharacterString, error: false },
                        { it: 'should throw if postalCode is a number', value: 6, error: true },
                        { it: 'should throw if postalCode is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.payee.InvalidPostalCode, errorNumber: 400
                }, {
                    target: 'country', tests: [
                        { it: 'should not throw if country is undefined', value: undefined, error: false },
                        { it: 'should not throw if country is null', value: null, error: false },
                        { it: 'should throw if country is boolean true', value: true, error: true },
                        { it: 'should throw if country is boolean false', value: false, error: true },
                        { it: 'should not throw if country is a zero length string', value: '', error: false },
                        { it: 'should not throw if country is a 3 character string', value: a3CharacterString, error: false },
                        { it: 'should throw if country is a 4 character string', value: a4CharacterString, error: true },
                        { it: 'should throw if country is a number', value: 6, error: true },
                        { it: 'should throw if country is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.payee.InvalidCountry, errorNumber: 400
                }, {
                    target: 'phoneNumber', tests: [
                        { it: 'should not throw if phoneNumber is undefined', value: undefined, error: false },
                        { it: 'should not throw if phoneNumber is null', value: null, error: false },
                        { it: 'should throw if phoneNumber is boolean true', value: true, error: true },
                        { it: 'should throw if phoneNumber is boolean false', value: false, error: true },
                        { it: 'should not throw if phoneNumber is a zero length string', value: '', error: false },
                        { it: 'should not throw if phoneNumber is a 32 character string', value: a32CharacterString, error: false },
                        { it: 'should throw if phoneNumber is a 33 character string', value: a33CharacterString, error: true },
                        { it: 'should throw if phoneNumber is a number', value: 6, error: true },
                        { it: 'should throw if phoneNumber is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.payee.InvalidPhoneNumber, errorNumber: 400
                }, {
                    target: 'payeeBankId', tests: [
                        { it: 'should not throw if payeeBankId is undefined', value: undefined, error: false },
                        { it: 'should not throw if payeeBankId is null', value: null, error: false },
                        { it: 'should throw if payeeBankId is boolean true', value: true, error: true },
                        { it: 'should throw if payeeBankId is boolean false', value: false, error: true },
                        { it: 'should not throw if payeeBankId is a zero length string', value: '', error: false },
                        { it: 'should not throw if payeeBankId is a string', value: a9CharacterString, error: false },
                        { it: 'should throw if payeeBankId is a number', value: 6, error: true },
                        { it: 'should throw if payeeBankId is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.payee.InvalidBankId, errorNumber: 400
                }, {
                    target: 'payeeAccountId', tests: [
                        { it: 'should not throw if payeeAccountId is undefined', value: undefined, error: false },
                        { it: 'should not throw if payeeAccountId is null', value: null, error: false },
                        { it: 'should throw if payeeAccountId is boolean true', value: true, error: true },
                        { it: 'should throw if payeeAccountId is boolean false', value: false, error: true },
                        { it: 'should not throw if payeeAccountId is a zero length string', value: '', error: false },
                        { it: 'should not throw if payeeAccountId is a string', value: a22CharacterString, error: false },
                        { it: 'should throw if payeeAccountId is a number', value: 6, error: true },
                        { it: 'should throw if payeeAccountId is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.payee.InvalidAccountId, errorNumber: 400
                }];

                let coordinateTests = [{
                    target: 'lat', tests: [
                        {it: 'should not throw if lat is a valid number', value: 100, error: false},
                        {it: 'should throw if lat is undefined', value: undefined, error: true},
                        {it: 'should throw if lat is null', value: null, error: true},
                        {it: 'should throw if lat is boolean true', value: true, error: true},
                        {it: 'should throw if lat is boolean false', value: false, error: true},
                        {it: 'should throw if lat is a zero length string', value: '', error: true},
                        {it: 'should throw if lat is NaN', value: NaN, error: true},
                        {it: 'should throw if lat is a string', value: 'WrongNumber', error: true},
                        {it: 'should throw if lat is an object', value: {}, error: true}
                    ]
                    , errorCode: common.services.transaction.coordinates.InvalidCoordinateLat, errorNumber: 400
                }, {
                    target: 'long', tests: [
                        {it: 'should not throw if long is a valid number', value: 100, error: false},
                        {it: 'should throw if long is undefined', value: undefined, error: true},
                        {it: 'should throw if long is null', value: null, error: true},
                        {it: 'should throw if long is boolean true', value: true, error: true},
                        {it: 'should throw if long is boolean false', value: false, error: true},
                        {it: 'should throw if long is a zero length string', value: '', error: true},
                        {it: 'should throw if long is NaN', value: NaN, error: true},
                        {it: 'should throw if long is a string', value: 'WrongNumber', error: true},
                        {it: 'should throw if long is an object', value: {}, error: true}
                    ]
                    , errorCode: common.services.transaction.coordinates.InvalidCoordinateLong, errorNumber: 400
                }];

                let actionAccountPostingTests = [{
                    target: 'accountsTransactionId', tests: [
                        {
                            it: 'should not throw if accountsPosting accountsTransactionId is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should throw if accountsPosting accountsTransactionId is number', value: 100, error: true},
                        {it: 'should throw if accountsPosting accountsTransactionId is float', value: 100.23, error: true},
                        {it: 'should not throw if accountsPosting accountsTransactionId is string', value: 'string', error: false},
                        {it: 'should throw if accountsPosting accountsTransactionId is object', value: {}, error: true},
                        {it: 'should throw if accountsPosting accountsTransactionId is bool', value: true, error: true},
                        {it: 'should throw if accountsPosting accountsTransactionId is NaN', value: NaN, error: true},
                        {it: 'should not throw if accountsPosting accountsTransactionId is null', value: null, error: false}
                    ]
                    , errorCode: common.services.transaction.actualAction.accountsPosting.accountsTransactionId, errorNumber: 400
                },{
                    target: 'type', tests: [
                        {
                            it: 'should not throw if accountsPosting type is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should throw if accountsPosting type is number', value: 100, error: true},
                        {it: 'should throw if accountsPosting type is float', value: 100.23, error: true},
                        {it: 'should not throw if accountsPosting type is string', value: 'string', error: false},
                        {it: 'should throw if accountsPosting type is object', value: {}, error: true},
                        {it: 'should throw if accountsPosting type is bool', value: true, error: true},
                        {it: 'should throw if accountsPosting type is NaN', value: NaN, error: true},
                        {it: 'should not throw if accountsPosting type is null', value: null, error: false}
                    ]
                    , errorCode: common.services.transaction.actualAction.accountsPosting.type, errorNumber: 400
                },{
                    target: 'reference', tests: [
                        {
                            it: 'should not throw if accountsPostings reference is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should throw if accountsPosting reference is number', value: 100, error: true},
                        {it: 'should throw if accountsPosting reference is float', value: 100.23, error: true},
                        {it: 'should not throw if accountsPosting reference is string', value: 'string', error: false},
                        {it: 'should throw if accountsPosting reference is object', value: {}, error: true},
                        {it: 'should throw if accountsPosting reference is bool', value: true, error: true},
                        {it: 'should throw if accountsPosting reference is NaN', value: NaN, error: true},
                        {it: 'should not throw if accountsPosting reference is null', value: null, error: false}
                    ]
                    , errorCode: common.services.transaction.actualAction.accountsPosting.reference, errorNumber: 400
                }];

                let actionAccountPostingsTests = [{
                    target: 'grossAmount', tests: [
                        {
                            it: 'should not throw if accountsPostings grossAmount is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should not throw if accountsPostings grossAmount is number', value: 100, error: false},
                        {it: 'should not throw if accountsPostings grossAmount is float', value: 100.23, error: false},
                        {it: 'should throw if accountsPostings grossAmount is string', value: 'string', error: true},
                        {it: 'should throw if accountsPostings grossAmount is object', value: {}, error: true},
                        {it: 'should throw if accountsPostings grossAmount is bool', value: true, error: true},
                        {it: 'should throw if accountsPostings grossAmount is NaN', value: NaN, error: true},
                        {it: 'should throw if accountsPostings grossAmount is null', value: null, error: true}
                    ]
                    , errorCode: common.services.transaction.accountsPostings.InvalidGrossAmount, errorNumber: 400
                },{
                    target: 'netAmount', tests: [
                        {
                            it: 'should not throw if accountsPostings netAmount is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should not throw if accountsPostings netAmount is number', value: 100, error: false},
                        {it: 'should not throw if accountsPostings netAmount is float', value: 100.23, error: false},
                        {it: 'should throw if accountsPostings netAmount is string', value: 'string', error: true},
                        {it: 'should throw if accountsPostings netAmount is object', value: {}, error: true},
                        {it: 'should throw if accountsPostings netAmount is bool', value: true, error: true},
                        {it: 'should throw if accountsPostings netAmount is NaN', value: NaN, error: true},
                        {it: 'should throw if accountsPostings netAmount is null', value: null, error: true}
                    ]
                    , errorCode: common.services.transaction.accountsPostings.InvalidNetAmount, errorNumber: 400
                },{
                    target: 'taxAmount', tests: [
                        {
                            it: 'should not throw if accountsPostings taxAmount is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should not throw if accountsPostings taxAmount is number', value: 100, error: false},
                        {it: 'should not throw if accountsPostings taxAmount is float', value: 100.23, error: false},
                        {it: 'should throw if accountsPostings taxAmount is string', value: 'string', error: true},
                        {it: 'should throw if accountsPostings taxAmount is object', value: {}, error: true},
                        {it: 'should throw if accountsPostings taxAmount is bool', value: true, error: true},
                        {it: 'should throw if accountsPostings taxAmount is NaN', value: NaN, error: true},
                        {it: 'should throw if accountsPostings taxAmount is null', value: null, error: true}
                    ]
                    , errorCode: common.services.transaction.accountsPostings.InvalidTaxAmount, errorNumber: 400
                }, {
                    target: 'accountantNarrative', tests: [
                        {
                            it: 'should not throw if splitPercentage splitAmount is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should throw if accountsPostings accountantNarrative is number', value: 100, error: true},
                        {it: 'should throw if accountsPostings accountantNarrative is float', value: 100.23, error: true},
                        {
                            it: 'should not throw if accountsPostings accountantNarrative is string',
                            value: 'string',
                            error: false
                        },
                        {it: 'should throw if accountsPostings accountantNarrative is object', value: {}, error: true},
                        {it: 'should throw if accountsPostings accountantNarrative is bool', value: true, error: true},
                        {it: 'should throw if accountsPostings accountantNarrative is NaN', value: NaN, error: true},
                        {it: 'should not throw if accountsPostings accountantNarrative is null', value: null, error: false}
                    ]
                    ,
                    errorCode: common.services.transaction.accountsPostings.InvalidAccountantNarrative,
                    errorNumber: 400

                }];

                let actionPostingInstructionsTests = [{
                    target: 'type',
                    tests: [
                        {
                            it: 'should throw if postingsInstructions type is undefined',
                            value: undefined,
                            error: true
                        },
                        {it: 'should throw if postingsInstructions type is number', value: 100, error: true},
                        {it: 'should throw if postingsInstructions type is float', value: 100.23, error: true},
                        {it: 'should not throw if postingsInstructions type is string', value: 'string', error: false},
                        {it: 'should throw if postingsInstructions type is object', value: {}, error: true},
                        {it: 'should throw if postingsInstructions type is bool', value: true, error: true},
                        {it: 'should throw if postingsInstructions type is NaN', value: NaN, error: true},
                        {it: 'should not throw if postingsInstructions type is null', value: null, error: true}
                    ]
                    ,
                    errorCode: common.services.transaction.actualAction.accountsPosting.accountsPostings.postingInstructions.InvalidType,
                    errorNumber: 400
                },{
                    target: 'userDefinedTypeName',
                    tests: [
                        {
                            it: 'should not throw if postingsInstructions userDefinedTypeName is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should throw if postingsInstructions userDefinedTypeName is number', value: 100, error: true},
                        {it: 'should throw if postingsInstructions userDefinedTypeName is float', value: 100.23, error: true},
                        {it: 'should not throw if postingsInstructions userDefinedTypeName is string', value: 'string', error: false},
                        {it: 'should throw if postingsInstructions userDefinedTypeName is object', value: {}, error: true},
                        {it: 'should throw if postingsInstructions userDefinedTypeName is bool', value: true, error: true},
                        {it: 'should throw if postingsInstructions userDefinedTypeName is NaN', value: NaN, error: true},
                        {it: 'should not throw if postingsInstructions userDefinedTypeName is null', value: null, error: false}
                    ]
                    ,
                    errorCode: common.services.transaction.actualAction.accountsPosting.accountsPostings.postingInstructions.InvalidType,
                    errorNumber: 400
                },{
                    target: 'code',
                    tests: [
                        {
                            it: 'should not throw if postingsInstructions code is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should throw if postingsInstructions code is number', value: 100, error: true},
                        {it: 'should throw if postingsInstructions code is float', value: 100.23, error: true},
                        {it: 'should not throw if postingsInstructions code is string', value: 'string', error: false},
                        {it: 'should throw if postingsInstructions code is object', value: {}, error: true},
                        {it: 'should throw if postingsInstructions code is bool', value: true, error: true},
                        {it: 'should throw if postingsInstructions code is NaN', value: NaN, error: true},
                        {it: 'should not throw if postingsInstructions code is null', value: null, error: false}
                    ]
                    ,
                    errorCode: common.services.transaction.accountsPostings.actions.InvalidType,
                    errorNumber: 400
                },{
                    target: 'name',
                    tests: [
                        {
                            it: 'should not throw if postingsInstructions name is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should throw if postingsInstructions name is number', value: 100, error: true},
                        {it: 'should throw if postingsInstructions name is float', value: 100.23, error: true},
                        {it: 'should not throw if postingsInstructions name is string', value: 'string', error: false},
                        {it: 'should throw if postingsInstructions name is object', value: {}, error: true},
                        {it: 'should throw if postingsInstructions name is bool', value: true, error: true},
                        {it: 'should throw if postingsInstructions name is NaN', value: NaN, error: true},
                        {it: 'should not throw if postingsInstructions name is null', value: null, error: false}
                    ]
                    ,
                    errorCode: common.services.transaction.accountsPostings.actions.InvalidType,
                    errorNumber: 400
                },{
                    target: 'status',
                    tests: [
                        {
                            it: 'should not throw if postingsInstructions status is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should throw if postingsInstructions status is number', value: 100, error: true},
                        {it: 'should throw if postingsInstructions status is float', value: 100.23, error: true},
                        {it: 'should not throw if postingsInstructions status is string', value: 'string', error: false},
                        {it: 'should throw if postingsInstructions status is object', value: {}, error: true},
                        {it: 'should throw if postingsInstructions status is bool', value: true, error: true},
                        {it: 'should throw if postingsInstructions status is NaN', value: NaN, error: true},
                        {it: 'should not throw if postingsInstructions status is null', value: null, error: false}
                    ]
                    ,
                    errorCode: common.services.transaction.accountsPostings.actions.InvalidType,
                    errorNumber: 400
                },{
                    target: 'value',
                    tests: [
                        {
                            it: 'should not throw if postingsInstructions value is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should not throw if postingsInstructions value is number', value: 100, error: false},
                        {it: 'should not throw if postingsInstructions value is float', value: 100.23, error: false},
                        {it: 'should throw if postingsInstructions value is string', value: 'string', error: true},
                        {it: 'should throw if postingsInstructions value is object', value: {}, error: true},
                        {it: 'should throw if postingsInstructions value is bool', value: true, error: true},
                        {it: 'should throw if postingsInstructions value is NaN', value: NaN, error: true},
                        {it: 'should not throw if postingsInstructions value is null', value: null, error: false}
                    ]
                    ,
                    errorCode: common.services.transaction.accountsPostings.actions.InvalidType,
                    errorNumber: 400
                },{
                    target: 'description',
                    tests: [
                        {
                            it: 'should not throw if postingsInstructions description is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should throw if postingsInstructions description is number', value: 100, error: true},
                        {it: 'should throw if postingsInstructions description is float', value: 100.23, error: true},
                        {it: 'should not throw if postingsInstructions description is string', value: 'string', error: false},
                        {it: 'should throw if postingsInstructions description is object', value: {}, error: true},
                        {it: 'should throw if postingsInstructions description is bool', value: true, error: true},
                        {it: 'should throw if postingsInstructions description is NaN', value: NaN, error: true},
                        {it: 'should not throw if postingsInstructions description is null', value: null, error: false}
                    ]
                    ,
                    errorCode: common.services.transaction.accountsPostings.actions.InvalidType,
                    errorNumber: 400
                }];

                let actionTests = [{
                    target: 'actionType', tests: [
                        { it: 'should throw if actionType is undefined', value: undefined, error: true },
                        { it: 'should throw if actionType is null', value: null, error: true },
                        { it: 'should throw if actionType is boolean true', value: true, error: true },
                        { it: 'should throw if actionType is boolean false', value: false, error: true },
                        { it: 'should not throw if actionType is a zero length string', value: '', error: false },
                        { it: 'should not throw if actionType is a valid character string', value: 'myString', error: false },
                        { it: 'should throw if actionType is a number', value: 6, error: true },
                        { it: 'should throw if actionType is an object', value: {}, error: true }
                    ]
                    , errorCode: common.services.transaction.actualAction.InvalidType, errorNumber: 400
                }
                ];

                let accountsPostingsTests = [{
                    target: 'grossAmount', tests: [
                        {
                            it: 'should not throw if accountsPostings grossAmount is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should not throw if accountsPostings grossAmount is number', value: 100, error: false},
                        {it: 'should not throw if accountsPostings grossAmount is float', value: 100.23, error: false},
                        {it: 'should throw if accountsPostings grossAmount is string', value: 'string', error: true},
                        {it: 'should throw if accountsPostings grossAmount is object', value: {}, error: true},
                        {it: 'should throw if accountsPostings grossAmount is bool', value: true, error: true},
                        {it: 'should throw if accountsPostings grossAmount is NaN', value: NaN, error: true},
                        {it: 'should throw if accountsPostings grossAmount is null', value: null, error: true}
                    ]
                    , errorCode: common.services.transaction.accountsPostings.InvalidGrossAmount, errorNumber: 400
                },{
                    target: 'netAmount', tests: [
                        {
                            it: 'should not throw if accountsPostings netAmount is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should not throw if accountsPostings netAmount is number', value: 100, error: false},
                        {it: 'should not throw if accountsPostings netAmount is float', value: 100.23, error: false},
                        {it: 'should throw if accountsPostings netAmount is string', value: 'string', error: true},
                        {it: 'should throw if accountsPostings netAmount is object', value: {}, error: true},
                        {it: 'should throw if accountsPostings netAmount is bool', value: true, error: true},
                        {it: 'should throw if accountsPostings netAmount is NaN', value: NaN, error: true},
                        {it: 'should throw if accountsPostings netAmount is null', value: null, error: true}
                    ]
                    , errorCode: common.services.transaction.accountsPostings.InvalidNetAmount, errorNumber: 400
                },{
                    target: 'taxAmount', tests: [
                        {
                            it: 'should not throw if accountsPostings taxAmount is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should not throw if accountsPostings taxAmount is number', value: 100, error: false},
                        {it: 'should not throw if accountsPostings taxAmount is float', value: 100.23, error: false},
                        {it: 'should throw if accountsPostings taxAmount is string', value: 'string', error: true},
                        {it: 'should throw if accountsPostings taxAmount is object', value: {}, error: true},
                        {it: 'should throw if accountsPostings taxAmount is bool', value: true, error: true},
                        {it: 'should throw if accountsPostings taxAmount is NaN', value: NaN, error: true},
                        {it: 'should throw if accountsPostings taxAmount is null', value: null, error: true}
                    ]
                    , errorCode: common.services.transaction.accountsPostings.InvalidTaxAmount, errorNumber: 400
                }, {
                    target: 'accountantNarrative', tests: [
                        {
                            it: 'should not throw if splitPercentage splitAmount is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should throw if accountsPostings accountantNarrative is number', value: 100, error: true},
                        {it: 'should throw if accountsPostings accountantNarrative is float', value: 100.23, error: true},
                        {
                            it: 'should not throw if accountsPostings accountantNarrative is string',
                            value: 'string',
                            error: false
                        },
                        {it: 'should throw if accountsPostings accountantNarrative is object', value: {}, error: true},
                        {it: 'should throw if accountsPostings accountantNarrative is bool', value: true, error: true},
                        {it: 'should throw if accountsPostings accountantNarrative is NaN', value: NaN, error: true},
                        {it: 'should not throw if accountsPostings accountantNarrative is null', value: null, error: false}
                    ]
                    ,
                    errorCode: common.services.transaction.accountsPostings.InvalidAccountantNarrative,
                    errorNumber: 400
                }];

                let postingInstructionsTests = [{
                    target: 'type',
                    tests: [
                        {
                            it: 'should not throw if postingsInstructions type is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should throw if postingsInstructions type is number', value: 100, error: true},
                        {it: 'should throw if postingsInstructions type is float', value: 100.23, error: true},
                        {it: 'should not throw if postingsInstructions type is string', value: 'string', error: false},
                        {it: 'should throw if postingsInstructions type is object', value: {}, error: true},
                        {it: 'should throw if postingsInstructions type is bool', value: true, error: true},
                        {it: 'should throw if postingsInstructions type is NaN', value: NaN, error: true},
                        {it: 'should not throw if postingsInstructions type is null', value: null, error: false}
                    ]
                    ,
                    errorCode: common.services.transaction.accountsPostings.actions.InvalidType,
                    errorNumber: 400
                },{
                    target: 'code',
                    tests: [
                        {
                            it: 'should not throw if postingsInstructions code is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should throw if postingsInstructions code is number', value: 100, error: true},
                        {it: 'should throw if postingsInstructions code is float', value: 100.23, error: true},
                        {it: 'should not throw if postingsInstructions code is string', value: 'string', error: false},
                        {it: 'should throw if postingsInstructions code is object', value: {}, error: true},
                        {it: 'should throw if postingsInstructions code is bool', value: true, error: true},
                        {it: 'should throw if postingsInstructions code is NaN', value: NaN, error: true},
                        {it: 'should not throw if postingsInstructions code is null', value: null, error: false}
                    ]
                    ,
                    errorCode: common.services.transaction.accountsPostings.actions.InvalidType,
                    errorNumber: 400
                },{
                    target: 'name',
                    tests: [
                        {
                            it: 'should not throw if postingsInstructions name is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should throw if postingsInstructions name is number', value: 100, error: true},
                        {it: 'should throw if postingsInstructions name is float', value: 100.23, error: true},
                        {it: 'should not throw if postingsInstructions name is string', value: 'string', error: false},
                        {it: 'should throw if postingsInstructions name is object', value: {}, error: true},
                        {it: 'should throw if postingsInstructions name is bool', value: true, error: true},
                        {it: 'should throw if postingsInstructions name is NaN', value: NaN, error: true},
                        {it: 'should not throw if postingsInstructions name is null', value: null, error: false}
                    ]
                    ,
                    errorCode: common.services.transaction.accountsPostings.actions.InvalidType,
                    errorNumber: 400
                },{
                    target: 'status',
                    tests: [
                        {
                            it: 'should not throw if postingsInstructions status is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should throw if postingsInstructions status is number', value: 100, error: true},
                        {it: 'should throw if postingsInstructions status is float', value: 100.23, error: true},
                        {it: 'should not throw if postingsInstructions status is string', value: 'string', error: false},
                        {it: 'should throw if postingsInstructions status is object', value: {}, error: true},
                        {it: 'should throw if postingsInstructions status is bool', value: true, error: true},
                        {it: 'should throw if postingsInstructions status is NaN', value: NaN, error: true},
                        {it: 'should not throw if postingsInstructions status is null', value: null, error: false}
                    ]
                    ,
                    errorCode: common.services.transaction.accountsPostings.actions.InvalidType,
                    errorNumber: 400
                },{
                    target: 'value',
                    tests: [
                        {
                            it: 'should not throw if postingsInstructions value is undefined',
                            value: undefined,
                            error: false
                        },
                        {it: 'should not throw if postingsInstructions value is number', value: 100, error: false},
                        {it: 'should not throw if postingsInstructions value is float', value: 100.23, error: false},
                        {it: 'should throw if postingsInstructions value is string', value: 'string', error: true},
                        {it: 'should throw if postingsInstructions value is object', value: {}, error: true},
                        {it: 'should throw if postingsInstructions value is bool', value: true, error: true},
                        {it: 'should throw if postingsInstructions value is NaN', value: NaN, error: true},
                        {it: 'should not throw if postingsInstructions value is null', value: null, error: false}
                    ]
                    ,
                    errorCode: common.services.transaction.accountsPostings.actions.InvalidType,
                    errorNumber: 400
                }];

                let additionalFieldsTests = [
                    {
                        target: 'name', tests: [
                        { it: 'should not throw if name is a valid string', value: 'receipt', error: false },
                        { it: 'should throw if name is a invalid string', value: 'not a receipt', error: true },
                        { it: 'should throw if name is an empty string', value: '', error: true },
                        { it: 'should throw if name is undefined', value: undefined, error: true },
                        { it: 'should throw if name is null', value: null, error: true },
                        { it: 'should throw if name is an object', value: { name: 'x' }, error: true },
                        { it: 'should throw if name is a number', value: 1, error: true },
                        { it: 'should throw if name is a boolean', value: true, error: true },
                    ]
                    }, {
                        target: 'value', tests: [
                            { it: 'should not throw if value is a 1-char string', value: 'x', error: false },
                            { it: 'should not throw if value is a 50-char string', value: a50CharacterString, error: false },
                            { it: 'should throw if value is a 51-char string', value: a51CharacterString, error: true },
                            { it: 'should throw if value is an empty string', value: '', error: true },
                            { it: 'should not throw if value is undefined', value: undefined, error: false },
                            { it: 'should not throw if value is null', value: null, error: false },
                            { it: 'should throw if value is an object', value: { value: 'x' }, error: true },
                            { it: 'should throw if value is a number', value: 1, error: true },
                            { it: 'should throw if value is a boolean', value: true, error: true },
                        ]
                    }, {
                        target: 'object', tests: [
                        { it: 'should not throw if value is undefined', value: undefined, error: false },
                        { it: 'should not throw if value is null', value: null, error: false },
                        { it: 'should throw if value is a number', value: 1, error: true },
                        { it: 'should throw if value is a boolean', value: true, error: true }
                        ]
                    }
                ];

                let receiptObjectTests = [
                    {
                        target: 'currency', tests: [
                        { it: 'should not throw if currency is a valid string', value: 'GBR', error: false },
                        { it: 'should throw if currency is a invalid string', value: 'not a currency', error: true },
                        { it: 'should throw if currency is an empty string', value: '', error: true },
                        { it: 'should throw if currency is undefined', value: undefined, error: true },
                        { it: 'should throw if currency is null', value: null, error: true },
                        { it: 'should throw if currency is an object', value: { name: 'x' }, error: true },
                        { it: 'should throw if currency is a number', value: 1, error: true },
                        { it: 'should throw if currency is a boolean', value: true, error: true },
                    ]}
                    , {
                        target: 'total', tests: [
                            { it: 'should throw if total is undefined', value: undefined, error: true },
                            { it: 'should throw if total is null', value: null, error: true },
                            { it: 'should throw if total is boolean true', value: true, error: true },
                            { it: 'should throw if total is boolean false', value: false, error: true },
                            { it: 'should throw if total is a zero length string', value: '', error: true },
                            { it: 'should throw if total is NaN', value: NaN, error: true },
                            { it: 'should not throw if total is a valid number', value: 100, error: false },
                            { it: 'should throw if total is a string', value: 'WrongNumber', error: true },
                            { it: 'should throw if total is an object', value: {}, error: true }
                        ]
                    }, {
                        target: 'receiptDate', tests: [
                            {it: 'should throw if receiptDate is undefined', value: undefined, error: true},
                            {it: 'should throw if receiptDate is null', value: null, error: true},
                            {it: 'should throw if receiptDate is boolean true', value: true, error: true},
                            {it: 'should throw if receiptDate is boolean false', value: false, error: true},
                            {it: 'should throw if receiptDate is a zero length string', value: '', error: true},
                            {it: 'should not throw if receiptDate is a valid date', value: new Date(), error: false},
                            {it: 'should throw if receiptDate is a string', value: 'WrongDate', error: true},
                            {it: 'should throw if receiptDate is a number', value: 6, error: true},
                            {it: 'should throw if receiptDate is an object', value: {}, error: true}
                        ]
                    }, {
                        target: 'merchantName', tests: [

                            { it: 'should not throw if value is a 50-char string', value: a50CharacterString, error: false },
                            { it: 'should throw if value is undefined', value: undefined, error: true },
                            { it: 'should throw if value is null', value: null, error: true },
                            { it: 'should throw if value is a number', value: 1, error: true },
                            { it: 'should throw if value is a boolean', value: true, error: true }
                        ]
                    }
                ];

                let runTest = function(target, tests, errorCode, errorNumber) {
                    describe(target, function(){
                        _.each(tests, function(test, index){
                            it(test.it, function(done){
                                try {
                                    newTransaction[target] = test.value;

                                    Transaction.validate(newTransaction);

                                    const result = test.error ? new Error(`${target} test ${index + 1}: should have thrown`) : undefined;
                                    done(result);
                                } catch(err){
                                    if(!test.error) {
                                        done((err instanceof Error) ? err : new Error());
                                    } else {
                                        err.should.be.instanceOf(StatusCodeError);
                                        err.statusCode.should.eql(400 );
                                        err.items[0].applicationCode.should.eql(_.isString(test.error) ? test.error : common.services.common.InvalidProperties );

                                        if(!test.skipParamAssert) {
                                            should(err.items[0].params[target]).eql(_.isArray(test.value) ? test.value[0] : test.value);
                                        }

                                        done();
                                    }
                                }
                            })
                        })
                    })
                };

                let runCategoryTest = function(target, tests, errorCode, errorNumber) {
                    describe(`category.${target}`, function(){
                        _.each(tests, function(test, index){
                            it(test.it, function(done){
                                try {
                                    newTransaction.category[target] = test.value;

                                    Transaction.validate(newTransaction);

                                    const result = test.error ? new Error(`${target} test ${index + 1}: should have thrown`) : undefined;
                                    done(result);
                                } catch(err){
                                    if(!test.error) {
                                        done((err instanceof Error) ? err : new Error());
                                    } else {
                                        err.should.be.instanceOf(StatusCodeError);
                                        err.statusCode.should.eql(400 );
                                        err.items[0].applicationCode.should.eql(_.isString(test.error) ? test.error : common.services.common.InvalidProperties );
                                        should(err.items[0].params[target]).eql(_.isArray(test.value) ? test.value[0] : test.value);

                                        done();
                                    }
                                }
                            })
                        })
                    })
                };

                let runPayeeTest = function(target, tests, errorCode, errorNumber) {
                    describe(`payee.${target}`, function(){
                        _.each(tests, function(test, index){
                            it(test.it, function(done){
                                try {
                                    newTransaction.payee[target] = test.value;

                                    Transaction.validate(newTransaction);

                                    const result = test.error ? new Error(`${target} test ${index + 1}: should have thrown`) : undefined;
                                    done(result);
                                } catch(err){
                                    if(!test.error) {
                                        done((err instanceof Error) ? err : new Error());
                                    } else {
                                        err.should.be.instanceOf(StatusCodeError);
                                        err.statusCode.should.eql(400 );
                                        err.items[0].applicationCode.should.eql(_.isString(test.error) ? test.error : common.services.common.InvalidProperties );
                                        should(err.items[0].params[target]).eql(_.isArray(test.value) ? test.value[0] : test.value);

                                        done();
                                    }
                                }
                            })
                        })
                    })
                };

                let runCoordinateTest = function(target, tests, errorCode, errorNumber) {
                    describe(`coordinates.${target}`, function(){
                        _.each(tests, function(test, index){
                            it(test.it, function(done){
                                try {
                                    newTransaction.coordinates[target] = test.value;

                                    Transaction.validate(newTransaction);

                                    const result = test.error ? new Error(`${target} test ${index + 1}: should have thrown`) : undefined;
                                    done(result);
                                } catch(err){
                                    if(!test.error) {
                                        done((err instanceof Error) ? err : new Error());
                                    } else {
                                        err.should.be.instanceOf(StatusCodeError);
                                        err.statusCode.should.eql(400 );
                                        err.items[0].applicationCode.should.eql(_.isString(test.error) ? test.error : common.services.common.InvalidProperties );
                                        should(err.items[0].params[target]).eql(_.isArray(test.value) ? test.value[0] : test.value);

                                        done();
                                    }
                                }
                            })
                        })
                    })
                };

                let runActionTest = function(target, tests, errorCode, errorNumber) {
                    describe(`actualAction.${target}`, function(){
                        _.each(tests, function(test, index){
                            it(test.it, function(done){
                                try {
                                    newTransaction.actualAction.action[target] = test.value;

                                    Transaction.validate(newTransaction);

                                    const result = test.error ? new Error(`${target} test ${index + 1}: should have thrown`) : undefined;
                                    done(result);
                                } catch(err){
                                    if(!test.error) {
                                        done((err instanceof Error) ? err : new Error());
                                    } else {
                                        err.should.be.instanceOf(StatusCodeError);
                                        err.statusCode.should.eql(400 );
                                        err.items[0].applicationCode.should.eql(_.isString(test.error) ? test.error : common.services.common.InvalidProperties );
                                        should(err.items[0].params[target]).eql(_.isArray(test.value) ? test.value[0] : test.value);

                                        done();
                                    }
                                }
                            })
                        })
                    })
                };

                let runActionAccountsPostingTests = function (target, tests, errorCode, errorNumber) {
                    describe(`actualAction.accountsPosting.${target}`, function(){
                        _.each(tests, function(test, index){
                            it(test.it, function(done){
                                try {
                                    newTransaction.actualAction.action.accountsPosting[target] = test.value;

                                    Transaction.validate(newTransaction);

                                    const result = test.error ? new Error(`${target} test ${index + 1}: should have thrown`) : undefined;
                                    done(result);
                                } catch(err){
                                    if(!test.error) {
                                        done((err instanceof Error) ? err : new Error());
                                    } else {
                                        err.should.be.instanceOf(StatusCodeError);
                                        err.statusCode.should.eql(400 );
                                        err.items[0].applicationCode.should.eql(_.isString(test.error) ? test.error : common.services.common.InvalidProperties );
                                        should(err.items[0].params[target]).eql(_.isArray(test.value) ? test.value[0] : test.value);

                                        done();
                                    }
                                }
                            })
                        })
                    })
                };

                let runActionAccountsPostingsTests = function (target, tests, errorCode, errorNumber) {
                    describe(`actualAction.accountsPosting.accountsPostings.${target}`, function () {
                        _.each(tests, function (test, index) {
                            it(test.it, function (done) {
                                try {

                                    _.each(newTransaction.actualAction.action.accountsPosting.accountsPostings, function (postings) {
                                        postings[target] = test.value;
                                    });

                                    Transaction.validate(newTransaction);

                                    const result = test.error ? new Error(`${target} test ${index + 1}: should have thrown`) : undefined;
                                    done(result);
                                } catch (err) {
                                    if (!test.error) {
                                        done((err instanceof Error) ? err : new Error());
                                    } else {
                                        err.should.be.instanceOf(StatusCodeError);
                                        err.statusCode.should.eql(400);
                                        err.items[0].applicationCode.should.eql(_.isString(test.error) ? test.error : common.services.common.InvalidProperties);
                                        should(err.items[0].params.accountsPostings[target]).eql(_.isArray(test.value) ? test.value[0] : test.value);

                                        done();
                                    }
                                }
                            })
                        })
                    })
                };

                let runActionPostingInstructionsTests = function (target, tests, errorCode, errorNumber) {
                    describe(`actualAction.accountsPosting.accountsPostings.postingInstructions.${target}`, function () {
                        _.each(tests, function (test, index) {
                            it(test.it, function (done) {
                                try {
                                    _.each(newTransaction.actualAction.action.accountsPosting.accountsPostings, function (postings) {
                                        _.each(postings.postingInstructions, function(instruction) {
                                            instruction[target] = test.value;
                                        });
                                    });

                                    Transaction.validate(newTransaction);

                                    const result = test.error ? new Error(`${target} test ${index + 1}: should have thrown`) : undefined;
                                    done(result);
                                } catch (err) {
                                    if (!test.error) {
                                        done((err instanceof Error) ? err : new Error());
                                    } else {
                                        err.should.be.instanceOf(StatusCodeError);
                                        err.statusCode.should.eql(400);
                                        err.items[0].applicationCode.should.eql(_.isString(test.error) ? test.error : common.services.common.InvalidProperties);

                                        should(err.items[0].params.accountsPostings.postingInstructions[0][target]).eql(_.isArray(test.value) ? test.value[0] : test.value);

                                        done();
                                    }
                                }
                            })
                        })
                    })
                };

                let runAccountsPostingsTests = function (target, tests, errorCode, errorNumber) {
                    describe(`accountsPostings.${target}`, function () {
                        _.each(tests, function (test, index) {
                            it(test.it, function (done) {
                                try {

                                    _.each(newTransaction.accountsPostings, function (postings) {
                                        postings[target] = test.value;
                                    });

                                    Transaction.validate(newTransaction);

                                    const result = test.error ? new Error(`${target} test ${index + 1}: should have thrown`) : undefined;
                                    done(result);
                                } catch (err) {
                                    if (!test.error) {
                                        done((err instanceof Error) ? err : new Error());
                                    } else {
                                        err.should.be.instanceOf(StatusCodeError);
                                        err.statusCode.should.eql(400);
                                        err.items[0].applicationCode.should.eql(_.isString(test.error) ? test.error : common.services.common.InvalidProperties);
                                        should(err.items[0].params[target]).eql(_.isArray(test.value) ? test.value[0] : test.value);

                                        done();
                                    }
                                }
                            })
                        })
                    })
                };

                let runPostingInstructionsTests = function (target, tests, errorCode, errorNumber) {
                    describe(`accountsPostings.postingInstructions.${target}`, function () {
                        _.each(tests, function (test, index) {
                            it(test.it, function (done) {
                                try {
                                    _.each(newTransaction.accountsPostings, function (postings) {
                                        _.each(postings.postingInstructions, function(instruction) {
                                            instruction[target] = test.value;
                                        });
                                    });

                                    Transaction.validate(newTransaction);

                                    const result = test.error ? new Error(`${target} test ${index + 1}: should have thrown`) : undefined;
                                    done(result);
                                } catch (err) {
                                    if (!test.error) {
                                        done((err instanceof Error) ? err : new Error());
                                    } else {
                                        err.should.be.instanceOf(StatusCodeError);
                                        err.statusCode.should.eql(400);
                                        err.items[0].applicationCode.should.eql(_.isString(test.error) ? test.error : common.services.common.InvalidProperties);
                                        should(err.items[0].params[target]).eql(_.isArray(test.value) ? test.value[0] : test.value);

                                        done();
                                    }
                                }
                            })
                        })
                    })
                };

                let runAdditionalFieldsTest = function(target, tests) {
                    describe(`providerAdditionalFields.${target}`, function () {
                        _.each(tests, (test, index) => {
                            it(test.it, (done) => {
                                try {
                                    newTransaction.providerAdditionalFields[0][target] = test.value;

                                    Transaction.validate(newTransaction);

                                    const result = test.error ? new Error(`${target} test ${index + 1}: should have thrown`) : undefined;
                                    done(result);
                                } catch (err) {
                                    if (!test.error) {
                                        done((err instanceof Error) ? err : new Error());
                                    } else {
                                        should(err).be.instanceOf(StatusCodeError);
                                        should(err.statusCode).eql(400);
                                        should(err.items[0].applicationCode).eql(common.services.common.InvalidProperties);
                                        should(err.items[0].params.providerAdditionalFields[target]).eql(_.isArray(test.value) ? test.value[0] : test.value);

                                        done();
                                    }
                                }
                            });
                        });
                    });
                };

                let runReceiptObjectTest = function(target, tests) {
                    describe(`providerAdditionalFields.object.${target}`, function () {
                        _.each(tests, (test, index) => {
                            it(test.it, (done) => {
                                try {
                                    newTransaction.providerAdditionalFields[0].object[target] = test.value;
                                    console.log('*** here', JSON.stringify(newTransaction,1));

                                    Transaction.validate(newTransaction);

                                    const result = test.error ? new Error(`${target} test ${index + 1}: should have thrown`) : undefined;
                                    done(result);
                                } catch (err) {
                                    if (!test.error) {

                                        done((err instanceof Error) ? err : new Error());
                                    } else {
                                        should(err).be.instanceOf(StatusCodeError);
                                        should(err.statusCode).eql(400);
                                        should(err.items[0].applicationCode).eql(common.services.common.InvalidProperties);
                                        should(err.items[0].params.providerAdditionalFields.object[target]).eql(_.isArray(test.value) ? test.value[0] : test.value);
                                        done();
                                    }
                                }
                            });
                        });
                    });
                };

                _.each(tests, function(test){
                    runTest(test.target, test.tests, test.errorCode, test.errorNumber);
                });

                _.each(categoryTests, function(test){
                    runCategoryTest(test.target, test.tests, test.errorCode, test.errorNumber);
                });

                _.each(payeeTests, function(test){
                    runPayeeTest(test.target, test.tests, test.errorCode, test.errorNumber);
                });

                _.each(coordinateTests, function(test){
                    runCoordinateTest(test.target, test.tests, test.errorCode, test.errorNumber);
                });

                _.each(accountsPostingsTests, function (test) {
                    runAccountsPostingsTests(test.target, test.tests, test.errorCode, test.errorNumber);
                });

                _.each(postingInstructionsTests, function (test) {
                    runPostingInstructionsTests(test.target, test.tests, test.errorCode, test.errorNumber);
                });

                _.each(actionTests, function(test){
                    runActionTest(test.target, test.tests, test.errorCode, test.errorNumber);
                });

                _.each(actionAccountPostingTests, function(test){
                    runActionAccountsPostingTests(test.target, test.tests, test.errorCode, test.errorNumber);
                });

                _.each(actionAccountPostingsTests, function(test){
                    runActionAccountsPostingsTests(test.target, test.tests, test.errorCode, test.errorNumber);
                });

                _.each(actionPostingInstructionsTests, function (test) {
                    runActionPostingInstructionsTests(test.target, test.tests, test.errorCode, test.errorNumber);
                });

                _.each(additionalFieldsTests, (test) => {
                    runAdditionalFieldsTest(test.target, test.tests);
                });

                _.each(receiptObjectTests, (test) => {
                    runReceiptObjectTest(test.target, test.tests);
                });

                // it('should not throw if a valid transactionType is used', function (done){
                //     try {
                //         var validTypes = ['CREDIT', 'DEBIT', 'INT', 'DIV', 'FEE', 'SRVCHG', 'DEP', 'ATM', 'POS', 'XFER', 'CHECK', 'PAYMENT', 'CASH', 'DIRECTDEP'];
                //         var arrayLength = validTypes.length;
                //
                //         for (var i = 0; i < arrayLength; i++) {
                //             var transactionData = freshTransactionData();
                //             transactionData.transactionType = validTypes[i];
                //             ValidateTransaction(transactionData);
                //         }
                //         done();
                //     } catch (err) {
                //         done(err instanceof Error ? err : new Error(err));
                //     }
                // });
                //
                // it('should not throw if a valid correctionAction is passed in', function (done){
                //     try {
                //         var validActions = ['REPLACE', 'DELETE'];
                //         var arrayLength = validActions.length;
                //
                //         for (var i = 0; i < arrayLength; i++) {
                //             var transactionData = freshTransactionData();
                //             transactionData.correctionAction = validActions[i];
                //             ValidateTransaction(transactionData);
                //         }
                //         done();
                //     } catch (err) {
                //         done(err instanceof Error ? err : new Error(err));
                //     }
                // });
                //
                // it('should throw multiple if invalid transactionId, checkNum and long are passed in', function (done){
                //     try{
                //         transactionData.transactionId = '';
                //         transactionData.checkNum = a13CharacterString;
                //         transactionData.coordinates.lat = 'ThisIsNotANumber';
                //
                //         ValidateTransaction(transactionData);
                //         done(new Error('should have thrown'));
                //     } catch(err){
                //
                //         err.should.be.instanceOf(StatusCodeError);
                //         err.statusCode.should.eql(400);
                //         err.items.length.should.eql(3);
                //
                //         err.items[0].message.should.eql(common.resources.services.transaction.InvalidTransactionId );
                //         err.items[0].params.should.eql({ transactionId: '' });
                //         err.items[1].message.should.eql(common.resources.services.transaction.InvalidCheckNum );
                //         err.items[1].params.should.eql({ checkNum: a13CharacterString });
                //         err.items[2].message.should.eql(common.resources.services.transaction.payee.InvalidCoordinateLat );
                //         err.items[2].params.should.eql({ lat: 'ThisIsNotANumber' });
                //
                //         done();
                //     }
                // });
            });


            // Stick a test in here to ensure that multiple errors can be reported
        });

        describe('Transaction.filter', function()   {
            let transaction;

            beforeEach(function () {
                transaction = new Transaction(freshTransactionData());
            });

            it('should filter out secret & irrelevant info', function (done) {
                transaction = Transaction.filter(transaction);

                let actual = _.keys(transaction).sort();
                should(actual).eql([
                    'accountsPostings',
                    'category',
                    'checkNum',
                    'coordinates',
                    'correctionAction',
                    'correctionId',
                    'currency',
                    'dateFundsAvailable',
                    'datePosted',
                    'dateUserInitiated',
                    'extendedName',
                    'feedSource',
                    'incrementedId',
                    'name',
                    'narrative1',
                    'narrative2',
                    'payee',
                    'predictedActions',
                    'providerAdditionalFields',
                    'referenceNumber',
                    'transactionAmount',
                    'transactionHash',
                    'transactionId',
                    'transactionNarrative',
                    'transactionStatus',
                    'transactionType',
                    'uuid'
                ]);

                done();
            });

            it('should not find internalProcessingStatus field', function (done) {
                transaction = Transaction.filter(transaction);

                should.not.exist(transaction.internalProcessingStatus);

                done();
            });

        });
    });

    describe('transaction getStringForHashing', function(){
        it('should return a string if the data is valid', function(done){
            try{
                let transaction = new Transaction(freshTransactionData());
                transaction.getStringForHashing('BankAccount', 'BankIdentifier');

                done();
            } catch(err){
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should throw an error if bank account is missing', function(done){
            try{
                let transaction = new Transaction(freshTransactionData());
                transaction.getStringForHashing(undefined, 'BankIdentifier');

                done(new Error('should have thrown'));
            } catch(err){

                err.should.be.instanceof(StatusCodeError);
                err.statusCode.should.eql(400);
                err.items[0].applicationCode.should.eql(common.services.transaction.InvalidHashComponent);

                done();
            }
        });

        it('should throw an error if bank identifier is missing', function(done){
            try{
                let transaction = new Transaction(freshTransactionData());
                transaction.getStringForHashing('BankAccount', undefined);

                done(new Error('should have thrown'));
            } catch(err){

                err.should.be.instanceof(StatusCodeError);
                err.statusCode.should.eql(400);
                err.items[0].applicationCode.should.eql(common.services.transaction.InvalidHashComponent);

                done();
            }
        });

        it('should throw an error if date posted is missing', function(done){
            try{
                let transaction = new Transaction(freshTransactionData());
                transaction.datePosted = undefined;
                transaction.getStringForHashing('BankAccount', 'BankIdentifier');

                done(new Error('should have thrown'));
            } catch(err){

                err.should.be.instanceof(StatusCodeError);
                err.statusCode.should.eql(400);
                err.items[0].applicationCode.should.eql(common.services.transaction.InvalidHashComponent);

                done();
            }
        });

        it('should throw an error if transaction amount is missing', function(done){
            try{
                let transaction = new Transaction(freshTransactionData());
                transaction.transactionAmount = undefined;
                transaction.getStringForHashing('BankAccount', 'BankIdentifier');

                done(new Error('should have thrown'));
            } catch(err){

                err.should.be.instanceof(StatusCodeError);
                err.statusCode.should.eql(400);
                err.items[0].applicationCode.should.eql(common.services.transaction.InvalidHashComponent);

                done();
            }
        });

        it('should throw an error if transaction type is missing', function(done){
            try{
                let transaction = new Transaction(freshTransactionData());
                transaction.transactionType = undefined;
                transaction.getStringForHashing('BankAccount', 'BankIdentifier');

                done(new Error('should have thrown'));
            } catch(err){

                err.should.be.instanceof(StatusCodeError);
                err.statusCode.should.eql(400);
                err.items[0].applicationCode.should.eql(common.services.transaction.InvalidHashComponent);

                done();
            }
        });

        it('should throw an error if transaction index is missing', function(done){
            try{
                let transaction = new Transaction(freshTransactionData());
                transaction.transactionIndex = undefined;
                transaction.getStringForHashing('BankAccount', 'BankIdentifier');

                done(new Error('should have thrown'));
            } catch(err){

                err.should.be.instanceof(StatusCodeError);
                err.statusCode.should.eql(400);
                err.items[0].applicationCode.should.eql(common.services.transaction.InvalidHashComponent);

                done();
            }
        });

        it('should throw an error if file identification number is missing', function(done){
            try{
                let transaction = new Transaction(freshTransactionData());
                transaction.fileIdentificationNumber = undefined;
                transaction.getStringForHashing('BankAccount', 'BankIdentifier');

                done(new Error('should have thrown'));
            } catch(err){

                err.should.be.instanceof(StatusCodeError);
                err.statusCode.should.eql(400);
                err.items[0].applicationCode.should.eql(common.services.transaction.InvalidHashComponent);

                done();
            }
        });
    });
});
