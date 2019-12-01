'use strict';

const Resources = require('@sage/bc-common-resources');
const { StatusCodeError } = require('@sage/bc-common-statuscodeerror');
const validators = require('@sage/bc-services-validators');

const Bank = require('../../lib/Bank');
const FileDescriptors = require('../../lib/FileDescriptors');
const should = require('should');
const sinon = require('sinon');
const _ = require('underscore');

describe('@sage/bc-contracts-bank.Bank', () => {
    let sandbox;
    let uuid;
    let bankProviderId;
    let name;
    let primaryCountry;
    let primaryCountry2CharIso;
    let authorisationMechanism;
    let authorisationData;
    let bankIdentifier;
    let topicName;
    let path;
    let accountTypes;
    let status;
    let internalStatuses;
    let address;
    let emailAddress;
    let agreement;
    let dataProvider;
    let aggregatorId;
    let aggregatorName;
    let quarantine;
    let offBoarding;
    let proxy;
    let data;

    const dummyError = new StatusCodeError('dummyError', 400);

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(validators);

        uuid = 'd73ebc4a-654b-4e87-ae35-b37fc562de06';
        bankProviderId = 'f686f71a-ad34-4056-8e49-5e368ac4a6a7';
        name = 'bank_name';
        primaryCountry = 'GBR';
        primaryCountry2CharIso = 'GB';
        authorisationMechanism = 'web';
        authorisationData = 'http://www.google.com';
        bankIdentifier = '042000013';
        topicName = 'topic_name';
        path = 'path';
        dataProvider = Bank.dataProviders.direct;
        accountTypes = [
            {
                name: 'Checking',
                mandatoryCustomerBankDetails: [
                    {
                        name: 'bank_specific_field',
                        value: 'bank_specific_value',
                        validation: '^.{1,128}$',
                        isAmendable: true
                    }
                ]
            },
            {
                name: 'Savings',
                mandatoryCustomerBankDetails: [
                    {
                        name: 'bank_specific_field',
                        value: 'bank_specific_value',
                        validation: '^.{1,128}$',
                        isAmendable: false
                    }
                ]
            }
        ];
        status = 'supported';
        internalStatuses = [Bank.internalStatusValues.clientDataFlowBlocked];
        address = '1 Bank Street, Financial District, Bank Town, BA11 NK11';
        emailAddress = 'hello@usbank.com';
        agreement = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
        quarantine = { forceQuarantine: false, transactionTypes: [] };
        proxy = { bankName: 'parent_bank_name', bankId: 'd73ebc4a-2222-2222-2222-222222222222' };
        offBoarding = {
            type: Bank.offBoardingTypes.email,
            instructions: 'This is what you do...',
            emailAddress: 'cancel@mybank.com',
            emailTitle: 'Cancellation Request'
        };
        aggregatorId = 'aggId';
        aggregatorName = 'plaid';
        data = {
            uuid,
            name,
            primaryCountry,
            primaryCountry2CharIso,
            authorisationMechanism,
            authorisationData,
            bankIdentifier,
            topicName,
            path,
            accountTypes,
            status,
            internalStatuses,
            address,
            emailAddress,
            agreement,
            dataProvider,
            quarantine,
            offBoardingMechanism: offBoarding,
            proxy,
            supportiframe: false,
            recentFileHistory: [],
            aggregatorId,
            aggregatorName,
            provider: {
                providerId: bankProviderId,
                authUrl: 'authUrl'
            },
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('contract', () => {
        describe('Exported object', () => {
            it('exported object should have expected properties', () => {
                should(Bank).have.properties(
                    'validate',
                    'filter',
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

        describe('constructor', () => {
            it('should create an instance of Bank', (done) => {
                try {
                    const bank = new Bank(data);
                    should(bank).be.instanceof(Bank);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should assign properties', (done) => {
                try {
                    const bank = new Bank(data);

                    should(bank.uuid).eql(uuid);
                    should(bank.name).eql(name);
                    should(bank.primaryCountry).eql(primaryCountry);
                    should(bank.primaryCountry2CharIso).eql(primaryCountry2CharIso);
                    should(bank.authorisationMechanism).eql(authorisationMechanism);
                    should(bank.authorisationData).eql(authorisationData);
                    should(bank.accountTypes).eql(accountTypes);
                    should(bank.status).eql(status);
                    should(bank.internalStatuses).eql(internalStatuses);
                    should(bank.dataProvider).eql(dataProvider);
                    should(bank.quarantine).eql(quarantine);
                    should(bank.offBoardingMechanism).eql(offBoarding);
                    should(bank.proxy).eql(proxy);
                    should(bank.supportiframe).eql(false);
                    bank.provider.should.eql({
                        providerId: bankProviderId,
                        authUrl: 'authUrl'
                    });

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should assign default properties', (done) => {
                try {
                    delete data.accountTypes;
                    delete data.recentFileHistory;
                    delete data.quarantine;
                    delete data.offBoardingMechanism;
                    delete data.proxy;
                    delete data.supportiframe;
                    delete data.internalStatuses;
                    delete data.dataProvider;
                    delete data.provider;

                    const bank = new Bank(data);

                    should(bank.accountTypes).eql([]);
                    should(bank.recentFileHistory).eql([]);
                    should(bank.internalStatuses).eql([]);
                    should(bank.quarantine).eql({ forceQuarantine: false, transactionTypes: [] });
                    should(bank.offBoardingMechanism).eql({ type: Bank.offBoardingTypes.none, instructions: '' });
                    should(bank.proxy).be.null();
                    should(bank.supportiframe).eql(true);
                    should(bank.dataProvider).eql(Bank.dataProviders.direct);
                    should(bank.provider).eql(null);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should not throw error if no data passed in', (done) => {
                try {
                    const bank = new Bank();
                    should(bank).be.instanceof(Bank);
                    should.not.exist(bank.uuid);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should allow plaid feature to be switched off', (done) => {
                try {
                    const bank = new Bank(data, false);

                    should(bank.uuid).eql(uuid);

                    should.not.exist(bank.plaidFeatureEnabled);
                    should.not.exist(bank.dataProvider);
                    should.not.exist(bank.aggregatorId);
                    should.not.exist(bank.aggregatorName);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should default plaid feature as on', (done) => {
                try {
                    const bank = new Bank(data);

                    should(bank).have.property('uuid', uuid);
                    should(bank).have.property('dataProvider', data.dataProvider);
                    should(bank).have.property('aggregatorId', data.aggregatorId);
                    should(bank).have.property('aggregatorName', data.aggregatorName);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should allow default plaid feature to be set on', (done) => {
                try {
                    const bank = new Bank(data, true);

                    should(bank).have.property('uuid', uuid);
                    should(bank).have.property('dataProvider', data.dataProvider);
                    should(bank).have.property('aggregatorId', data.aggregatorId);
                    should(bank).have.property('aggregatorName', data.aggregatorName);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });

        describe('Bank.prototype.validate', () => {
            it('should call Bank.validate', (done) => {
                sandbox.stub(Bank, 'validate');

                try {
                    const bank = new Bank(data);
                    bank.validate();

                    should(Bank.validate.callCount).eql(1);
                    should(Bank.validate.calledWithExactly(bank)).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });

        describe('Bank.validate', () => {
            let bank;

            const now = new Date();
            const len128 = 'x'.repeat(128);
            const len129 = 'x'.repeat(129);
            const validUuid = 'd73ebc4a-654b-4e87-ae35-b37fc562de06';

            const tests = [
                {
                    target: 'uuid',
                    tests: [
                        { it: 'should not throw if uuid is undefined', value: undefined, error: false },
                        { it: 'should throw if uuid is null', value: null, error: true },
                        { it: 'should throw if uuid is an empty string', value: '', error: true },
                        { it: 'should throw if uuid is not a valid uuid', value: 'not-a-uuid', error: true },
                        { it: 'should throw if uuid is a number', value: 9, error: true },
                        { it: 'should throw if uuid is an object', value: {}, error: true }
                    ]
                }, {
                    target: 'name',
                    tests: [
                        { it: 'should throw if name is undefined', value: undefined, error: true },
                        { it: 'should throw if name is null', value: null, error: true },
                        { it: 'should throw if name is a zero length string', value: '', error: true },
                        { it: 'should throw if name is greater than 128 characters', value: Resources.fixedLengthString.len129, error: true },
                        { it: 'should throw if name is a number', value: 129, error: true },
                        { it: 'should throw if name is an object', value: {}, error: true }
                    ]
                }, {
                    target: 'primaryCountry',
                    tests: [
                        { it: 'should throw if primaryCountry is undefined', value: undefined, error: true },
                        { it: 'should throw if primaryCountry is null', value: null, error: true },
                        { it: 'should throw if primaryCountry is a zero length string', value: '', error: true },
                        { it: 'should throw if primaryCountry is greater than 3 characters', value: Resources.fixedLengthString.len4, error: true },
                        { it: 'should throw if primaryCountry is a number', value: 129, error: true },
                        { it: 'should throw if primaryCountry is not a string', value: {}, error: true }
                    ]
                }, {
                    target: 'primaryCountry2CharIso',
                    tests: [
                        { it: 'should throw if primaryCountry2CharIso is undefined', value: undefined, error: true },
                        { it: 'should throw if primaryCountry2CharIso is null', value: null, error: true },
                        { it: 'should throw if primaryCountry2CharIso is a zero length string', value: '', error: true },
                        { it: 'should throw if primaryCountry2CharIso is greater than 2 characters', value: Resources.fixedLengthString.len3, error: true },
                        { it: 'should throw if primaryCountry2CharIso is a number', value: 129, error: true },
                        { it: 'should throw if primaryCountry2CharIso is not a string', value: {}, error: true }
                    ]
                }, {
                    target: 'authorisationMechanism',
                    tests: [
                        { it: 'should not throw if authorisationMechanism is web', value: 'web', error: false },
                        { it: 'should not throw if authorisationMechanism is form', value: 'form', error: false },
                        { it: 'should throw if authorisationMechanism is undefined', value: undefined, error: true },
                        { it: 'should throw if authorisationMechanism is null', value: null, error: true },
                        { it: 'should throw if authorisationMechanism is a zero length string', value: '', error: true },
                        { it: 'should throw if authorisationMechanism is greater than 3 characters', value: Resources.fixedLengthString.len4, error: true },
                        { it: 'should throw if authorisationMechanism is a number', value: 129, error: true },
                        { it: 'should throw if authorisationMechanism is not a string', value: {}, error: true }
                    ]
                }, {
                    target: 'authorisationData',
                    tests: [
                        { it: 'should not throw if authorisationData is undefined', value: undefined, error: false },
                        { it: 'should not throw if authorisationData is null', value: null, error: false },
                        { it: 'should throw if authorisationData is a zero length string', value: '', error: true },
                        { it: 'should throw if authorisationData is a number', value: 129, error: true },
                        { it: 'should throw if authorisationData is not a string', value: {}, error: true }
                    ]
                }, {
                    target: 'topicName',
                    tests: [
                        { it: 'should not throw if topicName is undefined', value: undefined, error: false },
                        { it: 'should throw if topicName is null', value: null, error: false },
                        { it: 'should throw if topicName is a zero length string', value: '', error: true },
                        { it: 'should not throw if topicName is 255 characters', value: Resources.fixedLengthString.len255, error: false },
                        { it: 'should throw if topicName is greater than 255 characters', value: Resources.fixedLengthString.len256, error: true },
                        { it: 'should throw if topicName is a number', value: 333, error: true },
                        { it: 'should throw if topicName is an object', value: {}, error: true }
                    ]
                }, {
                    target: 'status',
                    tests: [
                        { it: 'should throw if status is undefined', value: undefined, error: true },
                        { it: 'should throw if status is null', value: null, error: true },
                        { it: 'should throw if status is a zero length string', value: '', error: true },
                        { it: 'should throw if status is a number', value: 333, error: true },
                        { it: 'should throw if status is an object', value: {}, error: true },
                        { it: 'should not throw if status is \'supported\'', value: 'supported', error: false },
                        { it: 'should not throw if status is \'coming soon\'', value: 'coming soon', error: false },
                        { it: 'should not throw if status is \'not supported\'', value: 'not supported', error: false },
                        { it: 'should throw if status is not \'supported\', \'coming soon\' or \'not supported\'', value: 'something else', error: true }
                    ]
                }, {
                    target: 'internalStatuses',
                    tests: [
                        { it: 'should not throw if internalStatuses is an empty array', value: [], error: false },
                        { it: 'should throw if internalStatuses is undefined', value: undefined, error: true },
                        { it: 'should throw if internalStatuses is null', value: null, error: true },
                        { it: 'should throw if internalStatuses is an object', value: {}, error: true },
                        { it: 'should throw if internalStatuses is a string', value: 'clientDataFlowBlocked', error: true },
                        { it: 'should throw if internalStatuses is a number', value: 123, error: true },
                        { it: 'should throw if internalStatuses is a bool', value: true, error: true },

                        { it: 'should not throw if internalStatuses item value is valid enum', value: [Bank.internalStatusValues.clientDataFlowBlocked], error: false },
                        { it: 'should throw if internalStatuses item value is an invalid string', value: ['wibble'], error: true, skipParamAssert: true },
                        { it: 'should throw if internalStatuses item value is a number', value: [123], error: true, skipParamAssert: true },
                        { it: 'should throw if internalStatuses item value is a bool', value: [true], error: true, skipParamAssert: true },
                        { it: 'should throw if internalStatuses item value is an object', value: [{ internalStatuses: [Bank.internalStatusValues.clientDataFlowBlocked] }], error: true, skipParamAssert: true },
                        { it: 'should throw if internalStatuses item value is an array', value: [[Bank.internalStatusValues.clientDataFlowBlocked]], error: true, skipParamAssert: true },
                        { it: 'should throw if internalStatuses item value is null', value: [null], error: true, skipParamAssert: true },

                        { it: 'should not throw if internalStatuses has multiple values',
                            value: [Bank.internalStatusValues.clientDataFlowBlocked, Bank.internalStatusValues.clientDataFlowBlocked],
                            error: false },
                        { it: 'should throw if internalStatuses has a mix of valid and invalid values',
                            value: [Bank.internalStatusValues.clientDataFlowBlocked, 'abc'],
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if internalStatuses has a multiple invalid values', value: ['abc', 'def'], error: true, skipParamAssert: true }
                    ]
                }, {
                    target: 'address',
                    tests: [
                        { it: 'should not throw if address is undefined', value: undefined, error: false },
                        { it: 'should not throw if address is null', value: null, error: false },
                        { it: 'should throw if address is a zero length string', value: '', error: true },
                        { it: 'should throw if address is a number', value: 333, error: true },
                        { it: 'should throw if address is an object', value: {}, error: true },
                        { it: 'should not throw if address is 256 characters', value: Resources.fixedLengthString.len256, error: false },
                        { it: 'should throw if address is greater than 256 characters', value: `${Resources.fixedLengthString.len256}a`, error: true }
                    ]
                }, {
                    target: 'emailAddress',
                    tests: [
                        { it: 'should not throw if emailAddress is undefined', value: undefined, error: false },
                        { it: 'should not throw if emailAddress is null', value: null, error: false },
                        { it: 'should throw if emailAddress is a zero length string', value: '', error: true },
                        { it: 'should throw if emailAddress is a number', value: 333, error: true },
                        { it: 'should throw if emailAddress is an object', value: {}, error: true },
                        {
                            it: 'should not throw if emailAddress is 254 characters',
                            value: Resources.fixedLengthString.len254email,
                            error: false
                        },
                        {
                            it: 'should throw if emailAddress is greater than 254 characters',
                            value: `${Resources.fixedLengthString.len254email}a`,
                            error: true
                        }
                    ]
                }, {
                    target: 'agreement',
                    tests: [
                        { it: 'should not throw if agreement is undefined', value: undefined, error: false },
                        { it: 'should not throw if agreement is null', value: null, error: false },
                        { it: 'should throw if agreement is a zero length string', value: '', error: true },
                        { it: 'should throw if agreement is a number', value: 333, error: true },
                        { it: 'should throw if agreement is an object', value: {}, error: true },
                        { it: 'should not throw if agreement is less than 1000 characters', value: Resources.fixedLengthString.len256, error: false },
                        { it: 'should not throw if agreement is more than 1000 characters', value: Resources.fixedLengthString.len256 + Resources.fixedLengthString.len256 + Resources.fixedLengthString.len256 + Resources.fixedLengthString.len256, error: false }

                    ]
                }, {
                    target: 'dataProvider',
                    tests: [
                        { it: 'should throw if dataProvider is undefined', value: undefined, error: true },
                        { it: 'should throw if dataProvider is null', value: null, error: true },
                        { it: 'should not throw if dataProvider is valid string', value: 'direct', error: false },
                        { it: 'should throw if dataProvider is not valid string', value: 'zigzag', error: true },
                        { it: 'should throw if dataProvider is number', value: 8008135, error: true },
                        { it: 'should throw if dataProvider is object', value: {}, error: true }
                    ]
                }, {
                    target: 'supportiframe',
                    tests: [
                        { it: 'should not throw if supportiframe is boolean true', value: true, error: false },
                        { it: 'should not throw if supportiframe is boolean false', value: false, error: false },
                        { it: 'should throw if supportiframe is undefined', value: undefined, error: true },
                        { it: 'should throw if supportiframe is null', value: null, error: true },
                        { it: 'should throw if supportiframe is a string', value: 'true', error: true },
                        { it: 'should throw if supportiframe is a number', value: 0, error: true },
                        { it: 'should throw if supportiframe is an object', value: {}, error: true }
                    ]
                }, {
                    target: 'quarantine',
                    tests: [
                        { it: 'should throw if quarantine is undefined', value: undefined, error: true },
                        { it: 'should throw if quarantine is valid string', value: 'string', error: true },
                        { it: 'should throw if quarantine is empty string', value: '', error: true },
                        { it: 'should throw if quarantine is null', value: null, error: true },
                        { it: 'should throw if quarantine is number', value: 9, error: true },
                        { it: 'should not throw if quarantine is a valid object', value: { forceQuarantine: true, transactionTypes: [] } },

                        { it: 'should throw if quarantine.forceQuarantine is undefined',
                            value: {
                                forceQuarantine: undefined, transactionTypes: []
                            },
                            error: true,
                            skipParamAssert: true, },
                        { it: 'should throw if quarantine.forceQuarantine is null',
                            value: {
                                forceQuarantine: null, transactionTypes: []
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if quarantine.forceQuarantine is a number',
                            value: {
                                forceQuarantine: 1, transactionTypes: []
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if quarantine.forceQuarantine is string',
                            value: {
                                forceQuarantine: 'true', transactionTypes: []
                            },
                            error: true,
                            skipParamAssert: true },

                        { it: 'should throw if quarantine.transactionTypes is undefined',
                            value: {
                                forceQuarantine: true, transactionTypes: undefined
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if quarantine.transactionTypes is null',
                            value: {
                                forceQuarantine: true, transactionTypes: null
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if quarantine.transactionTypes is a number',
                            value: {
                                forceQuarantine: true, transactionTypes: 0
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if quarantine.transactionTypes is string',
                            value: {
                                forceQuarantine: true, transactionTypes: 'array'
                            },
                            error: true,
                            skipParamAssert: true },

                        { it: 'should throw if quarantine.transactionTypes[n].code is undefined',
                            value: {
                                forceQuarantine: true, transactionTypes: [{ code: undefined, status: Bank.quarantineValidationStatus.authorised, releasedCount: 0 }]
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if quarantine.transactionTypes[n].code is null',
                            value: {
                                forceQuarantine: true, transactionTypes: [{ code: null, status: Bank.quarantineValidationStatus.authorised, releasedCount: 0 }]
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if quarantine.transactionTypes[n].code is number',
                            value: {
                                forceQuarantine: true, transactionTypes: [{ code: 9, status: Bank.quarantineValidationStatus.authorised, releasedCount: 0 }]
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if quarantine.transactionTypes[n].code is object',
                            value: {
                                forceQuarantine: true, transactionTypes: [{ code: {}, status: Bank.quarantineValidationStatus.authorised, releasedCount: 0 }]
                            },
                            error: true,
                            skipParamAssert: true },

                        { it: 'should throw if quarantine.transactionTypes[n].status is undefined',
                            value: {
                                forceQuarantine: true, transactionTypes: [{ code: '001', status: undefined, releasedCount: 0 }]
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if quarantine.transactionTypes[n].status is null',
                            value: {
                                forceQuarantine: true, transactionTypes: [{ code: '001', status: null, releasedCount: 0 }]
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if quarantine.transactionTypes[n].status is number',
                            value: {
                                forceQuarantine: true, transactionTypes: [{ code: '001', status: 9, releasedCount: 0 }]
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if quarantine.transactionTypes[n].status is object',
                            value: {
                                forceQuarantine: true, transactionTypes: [{ code: '001', status: {}, releasedCount: 0 }]
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if quarantine.transactionTypes[n].status is not in enum',
                            value: {
                                forceQuarantine: true, transactionTypes: [{ code: '001', status: 'invalid', releasedCount: 0 }]
                            },
                            error: true,
                            skipParamAssert: true },

                        { it: 'should throw if quarantine.transactionTypes[n].releasedCount is undefined',
                            value: {
                                forceQuarantine: true, transactionTypes: [{ code: '001', status: Bank.quarantineValidationStatus.authorised, releasedCount: undefined }]
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if quarantine.transactionTypes[n].releasedCount is null',
                            value: {
                                forceQuarantine: true, transactionTypes: [{ code: '001', status: Bank.quarantineValidationStatus.authorised, releasedCount: null }]
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if quarantine.transactionTypes[n].releasedCount is string',
                            value: {
                                forceQuarantine: true, transactionTypes: [{ code: '001', status: Bank.quarantineValidationStatus.authorised, releasedCount: '1' }]
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if quarantine.transactionTypes[n].releasedCount is object',
                            value: {
                                forceQuarantine: true, transactionTypes: [{ code: '001', status: Bank.quarantineValidationStatus.authorised, releasedCount: {} }]
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if quarantine.transactionTypes[n].releasedCount is not in enum',
                            value: {
                                forceQuarantine: true, transactionTypes: [{ code: '001', status: Bank.quarantineValidationStatus.authorised, releasedCount: 'invalid' }]
                            },
                            error: true,
                            skipParamAssert: true },
                    ]
                }, {
                    target: 'offBoardingMechanism',
                    tests: [
                        { it: 'should throw if offBoardingMechanism is undefined', value: undefined, error: true },
                        { it: 'should throw if offBoardingMechanism is valid string', value: 'string', error: true },
                        { it: 'should throw if offBoardingMechanism is empty string', value: '', error: true },
                        { it: 'should throw if offBoardingMechanism is null', value: null, error: true },
                        { it: 'should throw if offBoardingMechanism is number', value: 9, error: true },
                        { it: 'should not throw if offBoardingMechanism is a valid object',
                            value:
                            { type: Bank.offBoardingTypes.email, instructions: 'wibble' } },
                        { it: 'should not throw if offBoardingMechanism.type is the valid email value',
                            value: {
                                type: Bank.offBoardingTypes.email, instructions: 'wibble'
                            },
                            error: false },
                        { it: 'should not throw if offBoardingMechanism.type is the valid direct value',
                            value: {
                                type: Bank.offBoardingTypes.direct, instructions: 'wibble'
                            },
                            error: false },
                        { it: 'should not throw if offBoardingMechanism.type is the valid none value',
                            value: {
                                type: Bank.offBoardingTypes.none, instructions: 'wibble'
                            },
                            error: false },
                        { it: 'should throw if offBoardingMechanism.type is an invalid string',
                            value: {
                                type: 'invalid', instructions: 'wibble'
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if offBoardingMechanism.type is undefined',
                            value: {
                                type: undefined, instructions: 'wibble'
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if offBoardingMechanism.type is null',
                            value: {
                                type: null, instructions: 'wibble'
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if offBoardingMechanism.type is a number',
                            value: {
                                type: 123, instructions: 'wibble'
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if offBoardingMechanism.type is a date',
                            value: {
                                type: now, instructions: 'wibble'
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if offBoardingMechanism.type is an object',
                            value: {
                                type: { type: Bank.offBoardingTypes.email }, instructions: 'wibble'
                            },
                            error: true,
                            skipParamAssert: true },

                        { it: 'should not throw if offBoardingMechanism.emailAddress is valid email string',
                            value: {
                                type: Bank.offBoardingTypes.email, instructions: 'wibble', emailAddress: 'me@mybank.com'
                            },
                            error: false },
                        { it: 'should not throw if offBoardingMechanism.emailAddress is undefined',
                            value: {
                                type: Bank.offBoardingTypes.email, instructions: 'wibble', emailAddress: 'me@mybank.com'
                            },
                            error: false },
                        { it: 'should not throw if offBoardingMechanism.emailAddress is null',
                            value: {
                                type: Bank.offBoardingTypes.email, instructions: 'wibble', emailAddress: 'me@mybank.com'
                            },
                            error: false },
                        { it: 'should throw if offBoardingMechanism.emailAddress is an invalid string',
                            value: {
                                type: Bank.offBoardingTypes.email, instructions: 'wibble', emailAddress: 'not_an_email'
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if offBoardingMechanism.emailAddress is a number',
                            value: {
                                type: Bank.offBoardingTypes.email, instructions: 'wibble', emailAddress: 123
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if offBoardingMechanism.emailAddress is a date',
                            value: {
                                type: Bank.offBoardingTypes.email, instructions: 'wibble', emailAddress: now
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if offBoardingMechanism.emailAddress is an object',
                            value: {
                                type: Bank.offBoardingTypes.email, instructions: 'wibble', emailAddress: { email: 'me@mybank.com' }
                            },
                            error: true,
                            skipParamAssert: true },

                        { it: 'should not throw if offBoardingMechanism.emailTitle is valid string',
                            value: {
                                type: Bank.offBoardingTypes.direct, instructions: 'wibble', emailTitle: len128
                            },
                            error: false },
                        { it: 'should not throw if offBoardingMechanism.emailTitle is undefined',
                            value: {
                                type: Bank.offBoardingTypes.direct, instructions: 'wibble', emailTitle: undefined
                            },
                            error: false },
                        { it: 'should not throw if offBoardingMechanism.emailTitle is null',
                            value: {
                                type: Bank.offBoardingTypes.direct, instructions: 'wibble', emailTitle: null
                            },
                            error: false },
                        { it: 'should throw if offBoardingMechanism.emailTitle string is too long',
                            value: {
                                type: Bank.offBoardingTypes.direct, instructions: 'wibble', emailTitle: len129
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if offBoardingMechanism.emailTitle is zero-length string',
                            value: {
                                type: Bank.offBoardingTypes.direct, instructions: 'wibble', emailTitle: ''
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if offBoardingMechanism.emailTitle is a number',
                            value: {
                                type: Bank.offBoardingTypes.direct, instructions: 'wibble', emailTitle: 123
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if offBoardingMechanism.emailTitle is a date',
                            value: {
                                type: Bank.offBoardingTypes.direct, instructions: 'wibble', emailTitle: now
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if offBoardingMechanism.emailTitle is an object',
                            value: {
                                type: Bank.offBoardingTypes.direct, instructions: 'wibble', emailTitle: { emailTitle: 'cancel' }
                            },
                            error: true,
                            skipParamAssert: true },

                        { it: 'should not throw if offBoardingMechanism.instructions is string',
                            value: {
                                type: Bank.offBoardingTypes.direct, instructions: 'wibble'
                            },
                            error: false },
                        { it: 'should not throw if offBoardingMechanism.instructions is undefined',
                            value: {
                                type: Bank.offBoardingTypes.direct, instructions: 'wibble'
                            },
                            error: false },
                        { it: 'should not throw if offBoardingMechanism.instructions is null',
                            value: {
                                type: Bank.offBoardingTypes.direct, instructions: null
                            },
                            error: false },
                        { it: 'should throw if offBoardingMechanism.instructions is a number',
                            value: {
                                type: Bank.offBoardingTypes.direct, instructions: 123
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if offBoardingMechanism.instructions is a date',
                            value: {
                                type: Bank.offBoardingTypes.direct, instructions: now
                            },
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if offBoardingMechanism.instructions is an object',
                            value: {
                                type: Bank.offBoardingTypes.direct, instructions: { instructions: 'abc' }
                            },
                            error: true,
                            skipParamAssert: true }
                    ]
                }, {
                    target: 'proxy',
                    tests: [
                        { it: 'should not throw if proxy is undefined', value: undefined },
                        { it: 'should not throw if proxy is null', value: null },
                        { it: 'should not throw if proxy is a valid object', value: { bankName: 'a_bank', bankId: validUuid } },
                        { it: 'should throw if proxy is a string', value: 'string', error: true },
                        { it: 'should throw if proxy is a number', value: 9, error: true },
                        { it: 'should throw if proxy is a boolean', value: true, error: true },

                        { it: 'should throw if proxy.bankName is undefined', value: { bankName: undefined, bankId: validUuid }, error: true, skipParamAssert: true },
                        { it: 'should throw if proxy.bankName is null', value: { bankName: null, bankId: validUuid }, error: true, skipParamAssert: true },
                        { it: 'should throw if proxy.bankName is a number', value: { bankName: 123, bankId: validUuid }, error: true, skipParamAssert: true },
                        { it: 'should throw if proxy.bankName is a boolean', value: { bankName: true, bankId: validUuid }, error: true, skipParamAssert: true },
                        { it: 'should throw if proxy.bankName is a zero length string', value: { bankName: '', bankId: validUuid }, error: true, skipParamAssert: true },
                        { it: 'should throw if proxy.bankName is greater than 128 characters', value: { bankName: Resources.fixedLengthString.len129, bankId: validUuid }, error: true, skipParamAssert: true },
                        { it: 'should throw if proxy.bankName is an object', value: { bankName: { bankName: 'valid_name', bankId: validUuid }, bankId: validUuid }, error: true, skipParamAssert: true },

                        { it: 'should throw if proxy.bankId is undefined', value: { bankName: 'valid_name', bankId: undefined }, error: true, skipParamAssert: true },
                        { it: 'should throw if proxy.bankId is null', value: { bankName: 'valid_name', bankId: null }, error: true, skipParamAssert: true },
                        { it: 'should throw if proxy.bankId is a number', value: { bankName: 'valid_name', bankId: 123 }, error: true, skipParamAssert: true },
                        { it: 'should throw if proxy.bankId is a boolean', value: { bankName: 'valid_name', bankId: true }, error: true, skipParamAssert: true },
                        { it: 'should throw if proxy.bankId is an empty string', value: { bankName: 'valid_name', bankId: '' }, error: true, skipParamAssert: true },
                        { it: 'should throw if proxy.bankId is not a valid uuid', value: { bankName: 'valid_name', bankId: 'no_a_uuid' }, error: true, skipParamAssert: true },
                        { it: 'should throw if proxy.bankId is an object', value: { bankName: 'valid_name', bankId: { bankName: 'valid_name', bankId: validUuid } }, error: true, skipParamAssert: true },
                    ]
                }, {
                    target: 'recentFileHistory',
                    tests: [
                        { it: 'should not throw if recentFileHistory is undefined', value: undefined, error: false },
                        { it: 'should not throw if recentFileHistory is null', value: null, error: false },
                        { it: 'should throw if recentFileHistory is valid string', value: 'string', error: true, skipParamAssert: true },
                        { it: 'should throw if recentFileHistory is empty string', value: '', error: true, skipParamAssert: true },
                        { it: 'should throw if recentFileHistory is number', value: 9, error: true, skipParamAssert: true },
                        { it: 'should not throw if recentFileHistory is an array', value: [] },

                        { it: 'should throw if recentFileHistory.fileId is undefined',
                            value: [
                                { fileId: undefined, fileName: 'file.txt', timestamp: now }
                            ],
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.fileId is null',
                            value: [
                                { fileId: null, fileName: 'file.txt', timestamp: now }
                            ],
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.fileId is a number',
                            value: [
                                { fileId: 9, fileName: 'file.txt', timestamp: now }
                            ],
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.fileId is object',
                            value: [
                                { fileId: {}, fileName: 'file.txt', timestamp: now }
                            ],
                            error: true,
                            skipParamAssert: true },

                        { it: 'should throw if recentFileHistory.fileName is undefined',
                            value: [
                                { fileId: 'file_id', fileName: undefined, timestamp: now }
                            ],
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.fileName is null',
                            value: [
                                { fileId: 'file_id', fileName: null, timestamp: now }
                            ],
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.fileName is a number',
                            value: [
                                { fileId: 'file_id', fileName: 0, timestamp: now }
                            ],
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.fileName is object',
                            value: [
                                { fileId: 'file_id', fileName: {}, timestamp: now }
                            ],
                            error: true,
                            skipParamAssert: true },

                        { it: 'should not throw if recentFileHistory.timestamp is undefined',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: undefined }
                            ],
                            error: false,
                            skipParamAssert: true },
                        { it: 'should not throw if recentFileHistory.timestamp is null',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: null }
                            ],
                            error: false,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.timestamp is a number',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: 9 }
                            ],
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.timestamp is object',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: {} }
                            ],
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.timestamp is string',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: '2017-08-01T00:00:00.000Z' }
                            ],
                            error: true,
                            skipParamAssert: true },

                        { it: 'should not throw if recentFileHistory.quarantine is undefined',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: now, quarantine: undefined }
                            ],
                            error: false,
                            skipParamAssert: true },
                        { it: 'should not throw if recentFileHistory.quarantine is null',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: now, quarantine: null }
                            ],
                            error: false,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.quarantine is a number',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: now, quarantine: 9 }
                            ],
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.timestamp is string',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: now, quarantine: 'quarantine' }
                            ],
                            error: true,
                            skipParamAssert: true },

                        { it: 'should throw if recentFileHistory.quarantine.isQuarantined is undefined',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: now, quarantine: { isQuarantined: undefined, releaseDate: now } }
                            ],
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.quarantine.isQuarantined is null',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: now, quarantine: { isQuarantined: null, releaseDate: now } }
                            ],
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.quarantine.isQuarantined is a number',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: now, quarantine: { isQuarantined: 0, releaseDate: now } }
                            ],
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.timestamp.isQuarantined is string',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: now, quarantine: { isQuarantined: '', releaseDate: now } }
                            ],
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.timestamp.isQuarantined is object',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: now, quarantine: { isQuarantined: {}, releaseDate: now } }
                            ],
                            error: true,
                            skipParamAssert: true },

                        { it: 'should not throw if recentFileHistory.quarantine.releaseDate is undefined',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: now, quarantine: { isQuarantined: false, releaseDate: undefined } }
                            ],
                            error: false,
                            skipParamAssert: true },
                        { it: 'should not throw if recentFileHistory.quarantine.releaseDate is null',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: now, quarantine: { isQuarantined: false, releaseDate: null } }
                            ],
                            error: false,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.quarantine.releaseDate is a number',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: now, quarantine: { isQuarantined: false, releaseDate: 9 } }
                            ],
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.timestamp.releaseDate is string',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: now, quarantine: { isQuarantined: false, releaseDate: '2017-08-01T00:00:00.000Z' } }
                            ],
                            error: true,
                            skipParamAssert: true },
                        { it: 'should throw if recentFileHistory.timestamp.releaseDate is object',
                            value: [
                                { fileId: 'file_id', fileName: 'file.txt', timestamp: now, quarantine: { isQuarantined: false, releaseDate: {} } }
                            ],
                            error: true,
                            skipParamAssert: true }
                    ]
                }, {
                    target: 'provider', tests: [
                        { it: 'should not throw if provider is null', value: null },
                        { it: 'should not throw if provider is a valid object', value: { providerId: 'f686f71a-ad34-4056-8e49-5e368ac4a6a7', authUrl: 'authUrl' } },
                        { it: 'should throw if provider is a string', value: 'string', error: true },
                        { it: 'should throw if provider is a number', value: 9, error: true },
                        { it: 'should throw if provider is a boolean', value: true, error: true },

                        { it: 'should throw if provider.providerId is null', value: { providerId: null, authUrl: 'authUrl' }, error: true, skipParamAssert: true },
                        { it: 'should throw if provider.providerId is an empty string', value: { providerId: '', authUrl: 'authUrl' }, error: true, skipParamAssert: true },
                        { it: 'should throw if provider.providerId is not a valid uuid', value: { providerId: 'not_a_uuid', authUrl: 'authUrl' }, error: true, skipParamAssert: true },
                        { it: 'should throw if provider.providerId is a number', value: { providerId: 9, authUrl: 'authUrl' }, error: true, skipParamAssert: true },
                        { it: 'should throw if provider.providerId is an object', value: { providerId: {}, authUrl: 'authUrl' }, error: true, skipParamAssert: true },
                        { it: 'should throw if provider.providerId is a boolean', value: { providerId: true, authUrl: 'authUrl' }, error: true, skipParamAssert: true },

                        { it: 'should not throw if provider.authUrl is 255 characters', value: { providerId: bankProviderId, authUrl: Resources.fixedLengthString.len255 }, error: true, skipParamAssert: true },
                        { it: 'should throw if provider.authUrl is null', value: { providerId: bankProviderId, authUrl: null }, error: true, skipParamAssert: true },
                        { it: 'should throw if provider.authUrl is a zero length string', value: { providerId: bankProviderId, authUrl: '' }, error: true, skipParamAssert: true },
                        { it: 'should throw if provider.authUrl is greater than 255 characters', value: { providerId: bankProviderId, authUrl: Resources.fixedLengthString.len256 }, error: true, skipParamAssert: true },
                        { it: 'should throw if provider.authUrl is a number', value: { providerId: bankProviderId, authUrl: 3 }, error: true, skipParamAssert: true },
                        { it: 'should throw if provider.authUrl is an object', value: { providerId: bankProviderId, authUrl: {} }, error: true, skipParamAssert: true }
                    ]
                }];

            const accountTypesTests = [
                {
                    target: 'name',
                    tests: [
                        { it: 'should throw if name is null', value: null, error: true },
                        { it: 'should throw if name is empty string', value: '', error: true },
                        { it: 'should throw if name is number', value: 9, error: true },
                        { it: 'should throw if name is object', value: {}, error: true },
                        { it: 'should not throw if name is undefined', value: undefined, error: false },
                        { it: 'should not throw if name is Checking', value: 'Checking', error: false },
                        { it: 'should not throw if name is Savings', value: 'Savings', error: false },
                        { it: 'should not throw if name is Money Market', value: 'Money Market', error: false },
                        { it: 'should not throw if name is Line of Credit', value: 'Line of Credit', error: false },
                        {
                            it: 'should not throw if name is Certificate of Deposit',
                            value: 'Certificate of Deposit',
                            error: false
                        },
                        {
                            it: 'should not throw if name is Business Current Euro',
                            value: 'Business Current Euro',
                            error: false
                        },
                        { it: 'should not throw if name is Business Current', value: 'Business Current', error: false },
                        {
                            it: 'should not throw if name is Demand Deposit Account',
                            value: 'Demand Deposit Account',
                            error: false
                        },
                        {
                            it: 'should not throw if name is Interest Bearing Account',
                            value: 'Interest Bearing Account',
                            error: false
                        },
                        { it: 'should not throw if name is Sweep Account', value: 'Sweep Account', error: false }

                    ]
                }, {
                    target: 'mandatoryCustomerBankDetails',
                    tests: [
                        { it: 'should not throw if mandatoryCustomerBankDetails is undefined', value: undefined, error: false },
                        { it: 'should throw if mandatoryCustomerBankDetails is valid string', value: 'string', error: true },
                        { it: 'should throw if mandatoryCustomerBankDetails is empty string', value: '', error: true },
                        { it: 'should throw if mandatoryCustomerBankDetails is null', value: null, error: true },
                        { it: 'should throw if mandatoryCustomerBankDetails is number', value: 9, error: true }
                    ]
                }
            ];

            const mandatoryCustomerBankDetailsTests = [
                {
                    target: 'name',
                    tests: [
                        { it: 'should throw if name is undefined', value: undefined, error: true },
                        { it: 'should not throw if name is valid string', value: 'CHECKING', error: false },
                        { it: 'should throw if name is null', value: null, error: true },
                        { it: 'should throw if name is number', value: 9, error: true },
                        { it: 'should throw if name is object', value: {}, error: true }

                    ]
                }, {
                    target: 'value',
                    tests: [
                        { it: 'should throw if value is undefined', value: undefined, error: true },
                        { it: 'should not throw if value is valid string', value: 'CHECKING', error: false },
                        { it: 'should throw if value is null', value: null, error: true },
                        { it: 'should throw if value is number', value: 9, error: true },
                        { it: 'should throw if value is object', value: {}, error: true }
                    ]
                }, {
                    target: 'validation',
                    tests: [
                        { it: 'should throw if value is undefined', value: undefined, error: true },
                        { it: 'should not throw if value is valid string', value: 'CHECKING', error: false },
                        { it: 'should throw if value is null', value: null, error: true },
                        { it: 'should throw if value is number', value: 9, error: true },
                        { it: 'should throw if value is object', value: {}, error: true }
                    ]
                }, {
                    target: 'isAmendable',
                    tests: [
                        { it: 'should throw if value is undefined', value: undefined, error: true },
                        { it: 'should not throw if value is valid boolean', value: true, error: false },
                        { it: 'should throw if value is null', value: null, error: true },
                        { it: 'should throw if value is number', value: 9, error: true },
                        { it: 'should throw if value is object', value: {}, error: true }
                    ]
                }
            ];

            const runTest = (target, targetTests) => {
                describe(target, () => {
                    targetTests.forEach((test, index) => {
                        it(test.it, (done) => {
                            if (test.error) {
                                validators.validateContractObject.throws(dummyError);
                            } else {
                                validators.validateContractObject.returns(undefined);
                            }

                            try {
                                bank[target] = test.value;
                                const result = test.error ? new Error(`${target} test ${index}: should have thrown`) : undefined;

                                Bank.validate(bank);

                                done(result);
                            } catch (err) {
                                if (!test.error) {
                                    done((err instanceof Error) ? err : new Error());
                                } else {
                                    err.should.be.instanceOf(StatusCodeError);
                                    err.statusCode.should.eql(400);
                                    should(validators.validateContractObject.calledOnceWith(bank, Bank)).be.true();

                                    done();
                                }
                            }
                        });
                    });
                });
            };

            const runMandatoryCustomerBankDetailsTests = (target, targetTests) => {
                describe(target, () => {
                    _.each(targetTests, (test, index) => {
                        it(test.it, (done) => {
                            if (test.error) {
                                validators.validateContractObject.throws(dummyError);
                            } else {
                                validators.validateContractObject.returns(undefined);
                            }

                            try {
                                _.each(bank.accountTypes, (at) => {
                                    _.each(at.mandatoryCustomerBankDetails, (md) => {
                                        md[target] = test.value; // eslint-disable-line no-param-reassign
                                    });
                                });

                                const result = test.error ? new Error(`${target} test ${index}: should have thrown`) : undefined;

                                Bank.validate(bank);

                                done(result);
                            } catch (err) {
                                if (!test.error) {
                                    done((err instanceof Error) ? err : new Error());
                                } else {
                                    err.should.be.instanceOf(StatusCodeError);
                                    err.statusCode.should.eql(400);
                                    should(validators.validateContractObject.calledOnceWith(bank, Bank)).be.true();

                                    done();
                                }
                            }
                        });
                    });
                });
            };

            const runAccountTypesTests = (target, targetTests) => {
                describe(target, () => {
                    targetTests.forEach((test, index) => {
                        it(test.it, (done) => {
                            if (test.error) {
                                validators.validateContractObject.throws(dummyError);
                            } else {
                                validators.validateContractObject.returns(undefined);
                            }

                            try {
                                bank.accountTypes.forEach((at) => {
                                    at[target] = test.value; // eslint-disable-line no-param-reassign
                                });
                                const result = test.error ? new Error(`${target} test ${index}: should have thrown`) : undefined;

                                Bank.validate(bank);

                                done(result);
                            } catch (err) {
                                if (!test.error) {
                                    done((err instanceof Error) ? err : new Error());
                                } else {
                                    err.should.be.instanceOf(StatusCodeError);
                                    err.statusCode.should.eql(400);
                                    should(validators.validateContractObject.calledOnceWith(bank, Bank)).be.true();

                                    done();
                                }
                            }
                        });
                    });
                });
            };

            beforeEach(() => {
                bank = new Bank(data);
            });

            tests.forEach((test) => {
                runTest(test.target, test.tests);
            });

            accountTypesTests.forEach((test) => {
                runAccountTypesTests(test.target, test.tests);
            });

            mandatoryCustomerBankDetailsTests.forEach((test) => {
                runMandatoryCustomerBankDetailsTests(test.target, test.tests);
            });

            it('should not throw for valid data', (done) => {
                try {
                    Bank.validate(bank);
                    should(validators.validateContractObject.calledOnceWith(bank, Bank)).be.true();
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw if bank is undefined', (done) => {
                validators.validateContractObject.throws(dummyError);

                try {
                    Bank.validate(undefined);

                    done(new Error('should have thrown'));
                } catch (err) {
                    should(err).be.instanceOf(StatusCodeError);
                    should(err).have.property('statusCode', 400);

                    should(validators.validateContractObject.calledOnceWith(undefined, Bank)).be.true();

                    done();
                }
            });

            it('should throw if bank is null', (done) => {
                validators.validateContractObject.throws(dummyError);

                try {
                    Bank.validate(null);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceof(StatusCodeError);
                    err.statusCode.should.eql(400);
                    should(validators.validateContractObject.calledOnceWith(null, Bank)).be.true();

                    done();
                }
            });

            it('should throw if bank is not an instance of Bank', (done) => {
                validators.validateContractObject.throws(dummyError);

                try {
                    data = {};
                    Bank.validate(data);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceof(StatusCodeError);
                    err.statusCode.should.eql(400);
                    should(validators.validateContractObject.calledOnceWith(data, Bank)).be.true();

                    done();
                }
            });

            it('should throw multiple error items if all fields are invalid', (done) => {
                validators.validateContractObject.throws(dummyError);

                try {
                    bank.uuid = bank.name = bank.primaryCountry = bank.authorisationMechanism = null; // eslint-disable-line no-multi-assign
                    Bank.validate(bank);

                    done(new Error('should have thrown'));
                } catch (err) {
                    should(err).be.instanceOf(StatusCodeError);
                    should(err.statusCode).eql(400);
                    should(validators.validateContractObject.calledOnceWith(bank, Bank)).be.true();

                    done();
                }
            });
        });

        describe('Bank.validate.indirect', () => {
            let bank;

            beforeEach(() => {
                uuid = 'd73ebc4a-654b-4e87-ae35-b37fc562de07';
                name = 'bank_name';
                primaryCountry = 'GBR';
                dataProvider = Bank.dataProviders.indirect;
                aggregatorId = 'some_id';
                status = 'supported';

                data = {
                    uuid,
                    name,
                    primaryCountry,
                    status,
                    dataProvider,
                    aggregatorId,
                    aggregatorName: 'plaid'
                };

                bank = new Bank(data);
            });

            const tests = [
                {
                    /* for indirect dataProvider we can only test these scenarios as we have logic in controller to only kick in when bank.dataProvider === 'indirect' */
                    target: 'dataProvider',
                    tests: [
                        { it: 'should throw if dataProvider is undefined', value: undefined, error: true },
                        { it: 'should not throw if dataProvider is valid string', value: 'indirect', error: false }
                    ]
                }, {
                    target: 'aggregatorId',
                    tests: [
                        { it: 'should throw if aggregatorId is undefined', value: undefined, error: true },
                        { it: 'should throw if aggregatorId is null', value: null, error: true },
                        { it: 'should not throw if aggregatorId is valid string', value: 'string', error: false },
                        { it: 'should throw if aggregatorId is number', value: 8008135, error: true },
                        { it: 'should throw if aggregatorId is object', value: {}, error: true }
                    ]
                }, {
                    target: 'aggregatorName',
                    tests: [
                        { it: 'should throw if aggregatorName is undefined', value: undefined, error: true },
                        { it: 'should throw if aggregatorName is null', value: null, error: true },
                        { it: 'should not throw if aggregatorName is valid string', value: 'string', error: false },
                        { it: 'should throw if aggregatorName is number', value: 8008135, error: true },
                        { it: 'should throw if aggregatorName is object', value: {}, error: true }
                    ]
                }, {
                    target: 'uuid',
                    tests: [
                        { it: 'should not throw if uuid is undefined', value: undefined, error: false },
                        { it: 'should throw if uuid is null', value: null, error: true },
                        { it: 'should throw if uuid is an empty string', value: '', error: true },
                        { it: 'should throw if uuid is not a valid uuid', value: 'not-a-uuid', error: true },
                        { it: 'should throw if uuid is a number', value: 9, error: true },
                        { it: 'should throw if uuid is an object', value: {}, error: true }
                    ]
                }, {
                    target: 'name',
                    tests: [
                        { it: 'should throw if name is undefined', value: undefined, error: true },
                        { it: 'should throw if name is null', value: null, error: true },
                        { it: 'should throw if name is a zero length string', value: '', error: true },
                        { it: 'should throw if name is greater than 128 characters', value: Resources.fixedLengthString.len129, error: true },
                        { it: 'should throw if name is a number', value: 129, error: true },
                        { it: 'should throw if name is an object', value: {}, error: true }
                    ]
                }, {
                    target: 'primaryCountry',
                    tests: [
                        { it: 'should throw if primaryCountry is undefined', value: undefined, error: true },
                        { it: 'should throw if primaryCountry is null', value: null, error: true },
                        { it: 'should throw if primaryCountry is a zero length string', value: '', error: true },
                        { it: 'should throw if primaryCountry is greater than 3 characters', value: Resources.fixedLengthString.len4, error: true },
                        { it: 'should throw if primaryCountry is a number', value: 129, error: true },
                        { it: 'should throw if primaryCountry is not a string', value: {}, error: true }
                    ]
                }, {
                    target: 'status',
                    tests: [
                        { it: 'should throw if status is undefined', value: undefined, error: true },
                        { it: 'should throw if status is null', value: null, error: true },
                        { it: 'should throw if status is a zero length string', value: '', error: true },
                        { it: 'should throw if status is a number', value: 333, error: true },
                        { it: 'should throw if status is an object', value: {}, error: true },
                        { it: 'should not throw if status is \'supported\'', value: 'supported', error: false },
                        { it: 'should not throw if status is \'coming soon\'', value: 'coming soon', error: false },
                        { it: 'should not throw if status is \'not supported\'', value: 'not supported', error: false },
                        { it: 'should throw if status is not \'supported\', \'coming soon\' or \'not supported\'', value: 'something else', error: true }
                    ]
                }
            ];

            const runTest = (target, targetTests) => {
                describe(target, () => {
                    _.each(targetTests, (test, index) => {
                        it(test.it, (done) => {
                            if (test.error) {
                                validators.validateContractObject.throws(dummyError);
                            } else {
                                validators.validateContractObject.returns(undefined);
                            }

                            try {
                                bank[target] = test.value;
                                const result = test.error ? new Error(`${target} test ${index}: should have thrown`) : undefined;

                                Bank.validate(bank);

                                done(result);
                            } catch (err) {
                                if (!test.error) {
                                    done((err instanceof Error) ? err : new Error());
                                } else {
                                    err.should.be.instanceOf(StatusCodeError);
                                    err.statusCode.should.eql(400);
                                    should(validators.validateContractObject.calledOnceWith(bank, Bank)).be.true();

                                    done();
                                }
                            }
                        });
                    });
                });
            };

            tests.forEach((test) => {
                runTest(test.target, test.tests);
            });
        });

        describe('Bank.filter', () => {
            let bank;

            beforeEach(() => {
                bank = new Bank(data);
            });

            it('should filter out secret & irrelevant info', (done) => {
                try {
                    bank = Bank.filter(bank);

                    should.not.exists(bank.created);
                    should.not.exists(bank.updated);
                    should.not.exists(bank.etag);
                    should.not.exists(bank.offBoardingMechanism.emailAddress);
                    should.not.exists(bank.offBoardingMechanism.emailTitle);
                    should.not.exists(bank.proxy);
                    should.not.exists(bank.internalStatuses);
                    should.not.exists(bank.provider);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should not attempt to filter offboarding details if offboarding not populated', (done) => {
                delete bank.offBoardingMechanism;

                try {
                    bank = Bank.filter(bank);

                    should.not.exists(bank.created);
                    should.not.exists(bank.updated);
                    should.not.exists(bank.etag);
                    should.not.exists(bank.offBoardingMechanism);
                    should.not.exists(bank.proxy);
                    should.not.exists(bank.internalStatuses);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should not attempt to filter aggregator details if plaidFeatureEnabled not set', (done) => {
                delete bank.dataProvider;

                try {
                    bank = Bank.filter(bank);

                    // make sure other properties still filtered out
                    should.not.exists(bank.created);
                    should.not.exists(bank.updated);
                    should.not.exists(bank.etag);
                    should.not.exists(bank.offBoardingMechanism.emailAddress);
                    should.not.exists(bank.offBoardingMechanism.emailTitle);
                    should.not.exists(bank.proxy);
                    should.not.exists(bank.internalStatuses);

                    // aggregator details should not have been deleted
                    should.exist(bank.aggregatorId);
                    should.exist(bank.aggregatorName);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });

        describe('Bank.recentFileDescriptors', () => {
            it('should create a new instance of FileDescriptors', () => {
                const bank = new Bank(data);
                const result = bank.recentFileDescriptors();
                should(result).be.instanceOf(FileDescriptors);
            });
        });
    });
});