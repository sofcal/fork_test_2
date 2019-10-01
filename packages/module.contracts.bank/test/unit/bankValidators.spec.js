const validators = require('@sage/bc-services-validators');
const { StatusCodeErrorItem } = require('@sage/bc-statuscodeerror');
const Resources = require('@sage/bc-common-resources');
const should = require('should');
const sinon = require('sinon');
const _ = require('underscore');

const bankValidators = require('../../lib/bankValidators');
const dict = require('../../lib/bankDictionary');

describe('@sage/bc-contracts-bank.bankValidators', () => {
    let sandbox;
    let bank;
    let val;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(validators);

        bank = {
            authorisationMechanism: 'form',
        };
        val = bankValidators(bank);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('exported object', () => {
        it('should export bankValidators', () => {
            should(bankValidators).be.a.Function();
        });

        it('should return an object when bank object passed in', () => {
            should(val).be.an.Object().with.properties(
                'validateNumber',
                'isFormAuthorisation',
                'validateMandatoryCustomerBankDetails',
                'validateAccountTypes',
                'validateDataProvider',
                'validateQuarantine',
                'validateRecentFileHistory',
                'validateOffBoardingMechanism',
                'validateProxy',
                'validateInternalStatuses',
            );
        });
    });

    describe('validateNumber', () => {
        it('return true for a number', () => {
            should(val.validateNumber(1)).eql(true);
        });

        it('should return false if non-numeric value passed in', () => {
            should(val.validateNumber('1')).eql(false);
        });

        it('should return false if NaN value passed in', () => {
            should(val.validateNumber(Number.NaN)).eql(false);
        });

        it('should return false if undefined value passed in', () => {
            should(val.validateNumber()).eql(false);
        });
    });

    describe('isFormAuthorisation', () => {
        it('should return true if auth mechanism is form', () => {
            bank.authorisationMechanism = dict.AuthorisationMechanism.form;
            should(val.isFormAuthorisation()).be.true();
        });

        it('should return false if auth mechanism is not form', () => {
            bank.authorisationMechanism = 'invalid';
            should(val.isFormAuthorisation()).be.false();
        });
    });

    describe('validateMandatoryCustomerBankDetails', () => {
        it('should return any errors from validateTypeNoThrow', () => {
            const valError = new Error('validateTypeNoThrow');
            validators.validateTypeNoThrow.returns(valError);
            const value = {};
            const props = { path: 'mandatoryCustomerBankDetails', prefix: dict.name };

            should(val.validateMandatoryCustomerBankDetails(value)).eql([valError]);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            const { args } = validators.validateTypeNoThrow.lastCall;
            should(args).be.eql([value, Object, props]);
            should(validators.validateContractObjectNoThrow.called).be.false('should skip validateContractObjectNoThrow call');
        });

        it('should return any errors from validateContractObjectNoThrow', () => {
            validators.validateTypeNoThrow.returns(undefined);
            const valError = new Error('validateContractObjectNoThrow');
            validators.validateContractObjectNoThrow.returns(valError);
            const value = {};
            const props1 = { path: 'mandatoryCustomerBankDetails', prefix: dict.name };
            const props2 = [
                { path: 'name', custom: _.isString, optional: false },
                { path: 'value', custom: _.isString, optional: false },
                { path: 'validation', custom: _.isString, optional: false },
                { path: 'isAmendable', custom: _.isBoolean, optional: false }
            ];

            should(val.validateMandatoryCustomerBankDetails(value)).eql(valError);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            const { args: typeArgs } = validators.validateTypeNoThrow.lastCall;
            should(typeArgs).be.eql([value, Object, props1]);
            should(validators.validateContractObjectNoThrow.calledOnce).be.true('should call validateContractObjectNoThrow once');
            const { args: contractArgs } = validators.validateContractObjectNoThrow.lastCall;
            should(contractArgs).be.eql([value, Object, props2]);
        });

        it('should return undefined if validateTypeNoThrow andvalidateContractObjectNoThrow do not return any errors', () => {
            validators.validateTypeNoThrow.returns(undefined);
            validators.validateContractObjectNoThrow.returns(undefined);

            should(val.validateMandatoryCustomerBankDetails({})).eql(undefined);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            should(validators.validateContractObjectNoThrow.calledOnce).be.true('should call validateContractObjectNoThrow once');
        });
    });

    describe('validateAccountTypes', () => {
        it('should return any errors from validateTypeNoThrow', () => {
            const valError = new Error('validateTypeNoThrow');
            validators.validateTypeNoThrow.returns(valError);
            const value = {};
            const props = { path: 'accountTypes', prefix: dict.name };

            should(val.validateAccountTypes(value)).eql([valError]);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            const { args } = validators.validateTypeNoThrow.lastCall;
            should(args).be.eql([value, Object, props]);
            should(validators.validateContractObjectNoThrow.called).be.false('should skip validateContractObjectNoThrow call');
        });

        it('should return any errors from validateContractObjectNoThrow', () => {
            validators.validateTypeNoThrow.returns(undefined);
            const valError = new Error('validateContractObjectNoThrow');
            validators.validateContractObjectNoThrow.returns(valError);
            const value = {};
            const props1 = { path: 'accountTypes', prefix: dict.name };
            const props2 = [
                { path: 'name', regex: Resources.regex.bank.accountTypes, optional: true },
                { path: 'mandatoryCustomerBankDetails', nested: val.validateMandatoryCustomerBankDetails, optional: true }
            ];

            should(val.validateAccountTypes({})).eql(valError);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            const { args: typeArgs } = validators.validateTypeNoThrow.lastCall;
            should(typeArgs).be.eql([value, Object, props1]);
            should(validators.validateContractObjectNoThrow.calledOnce).be.true('should call validateContractObjectNoThrow once');
            const { args: contractArgs } = validators.validateContractObjectNoThrow.lastCall;
            should(contractArgs).be.eql([value, Object, props2]);
        });

        it('should return undefined if validateTypeNoThrow andvalidateContractObjectNoThrow do not return any errors', () => {
            validators.validateTypeNoThrow.returns(undefined);
            validators.validateContractObjectNoThrow.returns(undefined);

            should(val.validateAccountTypes({})).eql(undefined);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            should(validators.validateContractObjectNoThrow.calledOnce).be.true('should call validateContractObjectNoThrow once');
        });
    });

    describe('validateDataProvider', () => {
        it('should return true for valid data provider', () => {
            const [dp] = Object.values(dict.dataProviders);

            should(val.validateDataProvider(dp)).be.true('Should return true for valid value');
        });

        it('should return false for invalid data provider', () => {
            const [dp] = 'invalid';

            should(val.validateDataProvider(dp)).be.false('Should return false for invalid value');
        });
    });

    describe('validateStatus', () => {
        it('should return true for valid status', () => {
            const [status] = Object.values(dict.quarantineValidationStatus);

            should(val.validateStatus(status)).be.true('Should return true for valid value');
        });

        it('should return false for invalid status', () => {
            const [status] = 'invalid';

            should(val.validateStatus(status)).be.false('Should return false for invalid value');
        });
    });

    describe('validateTransactionTypes', () => {
        it('should return any errors from validateContractObjectNoThrow', () => {
            const valError = new Error('validateContractObjectNoThrow');
            validators.validateContractObjectNoThrow.returns(valError);
            const value = [
                {
                    code: 'code',
                    status: 'status',
                    releasedCount: 'releasedCount',
                }
            ];
            const props = [
                { path: 'code', custom: _.isString },
                { path: 'status', custom: val.validateStatus },
                { path: 'releasedCount', custom: val.validateNumber }
            ];

            should(val.validateTransactionTypes(value)).eql([valError]);
            should(validators.validateContractObjectNoThrow.calledOnce).be.true(`should call validateContractObjectNoThrow once - actually called ${validators.validateContractObjectNoThrow.callCount}`);
            const { args } = validators.validateContractObjectNoThrow.lastCall;
            should(args).be.eql([value[0], Object, props, 'transactionTypes']);
        });

        it('should return undefined if validateTypeNoThrow andvalidateContractObjectNoThrow do not return any errors', () => {
            validators.validateContractObjectNoThrow.returns(undefined);
            const value = [
                {
                    code: 'code',
                    status: 'status',
                    releasedCount: 'releasedCount',
                }
            ];
            const props = [
                { path: 'code', custom: _.isString },
                { path: 'status', custom: val.validateStatus },
                { path: 'releasedCount', custom: val.validateNumber }
            ];

            should(val.validateTransactionTypes(value)).eql([undefined]);
            should(validators.validateContractObjectNoThrow.calledOnce).be.true(`should call validateContractObjectNoThrow once - actually called ${validators.validateContractObjectNoThrow.callCount}`);
            const { args } = validators.validateContractObjectNoThrow.lastCall;
            should(args).be.eql([value[0], Object, props, 'transactionTypes']);
        });
    });

    describe('validateQuarantine', () => {
        it('should return any errors from validateTypeNoThrow', () => {
            const valError = new Error('validateTypeNoThrow');
            validators.validateTypeNoThrow.returns(valError);
            const value = {};
            const props = { path: 'quarantine', prefix: dict.name };

            should(val.validateQuarantine(value)).eql([valError]);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            const { args } = validators.validateTypeNoThrow.lastCall;
            should(args).be.eql([value, Object, props]);
            should(validators.validateContractObjectNoThrow.called).be.false('should skip validateContractObjectNoThrow call');
        });

        it('should return any errors from validateContractObjectNoThrow', () => {
            validators.validateTypeNoThrow.returns(undefined);
            const valError = new Error('validateContractObjectNoThrow');
            validators.validateContractObjectNoThrow.returns(valError);
            const value = {};
            const props1 = { path: 'quarantine', prefix: dict.name };
            const props2 = [
                { path: 'forceQuarantine', custom: _.isBoolean },
                { path: 'transactionTypes', arrayCustom: val.validateTransactionTypes, allowEmptyArray: true }
            ];

            should(val.validateQuarantine(value)).eql(valError);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            const { args: typeArgs } = validators.validateTypeNoThrow.lastCall;
            should(typeArgs).be.eql([value, Object, props1]);
            should(validators.validateContractObjectNoThrow.calledOnce).be.true('should call validateContractObjectNoThrow once');
            const { args: contractArgs } = validators.validateContractObjectNoThrow.lastCall;
            should(contractArgs).be.eql([value, Object, props2, null]);
        });

        it('should return undefined if validateTypeNoThrow andvalidateContractObjectNoThrow do not return any errors', () => {
            validators.validateTypeNoThrow.returns(undefined);
            validators.validateContractObjectNoThrow.returns(undefined);

            should(val.validateQuarantine({})).eql(undefined);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            should(validators.validateContractObjectNoThrow.calledOnce).be.true('should call validateContractObjectNoThrow once');
        });
    });

    describe('validateRFHQuarantine', () => {
        it('should return any errors from validateTypeNoThrow', () => {
            const valError = new Error('validateTypeNoThrow');
            validators.validateTypeNoThrow.returns(valError);
            const value = {};
            const props = { path: 'quarantine', prefix: dict.name };

            should(val.validateRFHQuarantine(value)).eql([valError]);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            const { args } = validators.validateTypeNoThrow.lastCall;
            should(args).be.eql([value, Object, props]);
            should(validators.validateContractObjectNoThrow.called).be.false('should skip validateContractObjectNoThrow call');
        });

        it('should return any errors from validateContractObjectNoThrow', () => {
            validators.validateTypeNoThrow.returns(undefined);
            const valError = new Error('validateContractObjectNoThrow');
            validators.validateContractObjectNoThrow.returns(valError);
            const value = {};
            const props1 = { path: 'quarantine', prefix: dict.name };
            const props2 = [
                { path: 'isQuarantined', custom: _.isBoolean },
                { path: 'releaseDate', custom: _.isDate, optional: true, allowNull: true },
            ];

            should(val.validateRFHQuarantine(value)).eql(valError);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            const { args: typeArgs } = validators.validateTypeNoThrow.lastCall;
            should(typeArgs).be.eql([value, Object, props1]);
            should(validators.validateContractObjectNoThrow.calledOnce).be.true('should call validateContractObjectNoThrow once');
            const { args: contractArgs } = validators.validateContractObjectNoThrow.lastCall;
            should(contractArgs).be.eql([value, Object, props2, null, true]);
        });

        it('should return undefined if validateTypeNoThrow andvalidateContractObjectNoThrow do not return any errors', () => {
            validators.validateTypeNoThrow.returns(undefined);
            validators.validateContractObjectNoThrow.returns(undefined);

            should(val.validateRFHQuarantine({})).eql(undefined);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            should(validators.validateContractObjectNoThrow.calledOnce).be.true('should call validateContractObjectNoThrow once');
        });
    });

    describe('validateRecentFileHistory', () => {
        it('should return any errors from validateTypeNoThrow', () => {
            const valError = new Error('validateTypeNoThrow');
            validators.validateTypeNoThrow.returns(valError);
            const value = {};
            const props = { path: 'quarantine', prefix: dict.name };

            should(val.validateRecentFileHistory(value)).eql([valError]);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            const { args } = validators.validateTypeNoThrow.lastCall;
            should(args).be.eql([value, Object, props]);
            should(validators.validateContractObjectNoThrow.called).be.false('should skip validateContractObjectNoThrow call');
        });

        it('should return any errors from validateContractObjectNoThrow', () => {
            validators.validateTypeNoThrow.returns(undefined);
            const valError = new Error('validateContractObjectNoThrow');
            validators.validateContractObjectNoThrow.returns(valError);
            const value = {};
            const props1 = { path: 'quarantine', prefix: dict.name };
            const props2 = [
                { path: 'timestamp', custom: _.isDate, optional: true, allowNull: true },
                { path: 'fileId', custom: _.isString },
                { path: 'fileName', custom: _.isString },
                { path: 'quarantine', nested: val.validateRFHQuarantine, optional: true, allowNull: true }
            ];

            should(val.validateRecentFileHistory(value)).eql(valError);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            const { args: typeArgs } = validators.validateTypeNoThrow.lastCall;
            should(typeArgs).be.eql([value, Object, props1]);
            should(validators.validateContractObjectNoThrow.calledOnce).be.true('should call validateContractObjectNoThrow once');
            const { args: contractArgs } = validators.validateContractObjectNoThrow.lastCall;
            should(contractArgs).be.eql([value, Object, props2, null, true]);
        });

        it('should return undefined if validateTypeNoThrow andvalidateContractObjectNoThrow do not return any errors', () => {
            validators.validateTypeNoThrow.returns(undefined);
            validators.validateContractObjectNoThrow.returns(undefined);

            should(val.validateRecentFileHistory({})).eql(undefined);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            should(validators.validateContractObjectNoThrow.calledOnce).be.true('should call validateContractObjectNoThrow once');
        });
    });

    describe('validateOffBoardingType', () => {
        it('should return true for valid status', () => {
            const [status] = Object.values(dict.offBoardingTypes);

            should(val.validateOffBoardingType(status)).be.true('Should return true for valid value');
        });

        it('should return false for invalid status', () => {
            const [status] = 'invalid';

            should(val.validateOffBoardingType(status)).be.false('Should return false for invalid value');
        });
    });

    describe('validateOffBoardingMechanism', () => {
        it('should return any errors from validateTypeNoThrow', () => {
            const valError = new Error('validateTypeNoThrow');
            validators.validateTypeNoThrow.returns(valError);
            const value = {};
            const props1 = { path: 'offBoardingMechanism', prefix: dict.name };

            should(val.validateOffBoardingMechanism(value)).eql([valError]);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            const { args } = validators.validateTypeNoThrow.lastCall;
            should(args).be.eql([value, Object, props1]);
            should(validators.validateContractObjectNoThrow.called).be.false('should skip validateContractObjectNoThrow call');
        });

        it('should return any errors from validateContractObjectNoThrow', () => {
            validators.validateTypeNoThrow.returns(undefined);
            const valError = new Error('validateContractObjectNoThrow');
            validators.validateContractObjectNoThrow.returns(valError);
            const value = {};
            const props1 = { path: 'offBoardingMechanism', prefix: dict.name };
            const props2 = [
                { path: 'type', custom: val.validateOffBoardingType },
                { path: 'instructions', custom: _.isString, optional: true, allowNull: true },
                { path: 'emailAddress', regex: Resources.regex.bank.emailAddress, optional: true, allowNull: true },
                { path: 'emailTitle', regex: Resources.regex.bank.offBoardingEmailTitle, optional: true, allowNull: true }
            ];

            should(val.validateOffBoardingMechanism(value)).eql(valError);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            const { args: typeArgs } = validators.validateTypeNoThrow.lastCall;
            should(typeArgs).be.eql([value, Object, props1]);
            should(validators.validateContractObjectNoThrow.calledOnce).be.true('should call validateContractObjectNoThrow once');
            const { args: contractArgs } = validators.validateContractObjectNoThrow.lastCall;
            should(contractArgs).be.eql([value, Object, props2, null]);
        });

        it('should return undefined if validateTypeNoThrow andvalidateContractObjectNoThrow do not return any errors', () => {
            validators.validateTypeNoThrow.returns(undefined);
            validators.validateContractObjectNoThrow.returns(undefined);

            should(val.validateOffBoardingMechanism({})).eql(undefined);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            should(validators.validateContractObjectNoThrow.calledOnce).be.true('should call validateContractObjectNoThrow once');
        });
    });

    describe('validateProxy', () => {
        it('should return any errors from validateTypeNoThrow', () => {
            const valError = new Error('validateTypeNoThrow');
            validators.validateTypeNoThrow.returns(valError);
            const value = {};
            const props1 = { path: 'proxy', prefix: dict.name };

            should(val.validateProxy(value)).eql([valError]);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            const { args: typeArgs } = validators.validateTypeNoThrow.lastCall;
            should(typeArgs).be.eql([value, Object, props1]);
            should(validators.validateContractObjectNoThrow.called).be.false('should skip validateContractObjectNoThrow call');
        });

        it('should return any errors from validateContractObjectNoThrow', () => {
            validators.validateTypeNoThrow.returns(undefined);
            const valError = new Error('validateContractObjectNoThrow');
            validators.validateContractObjectNoThrow.returns(valError);
            const value = {};
            const props1 = { path: 'proxy', prefix: dict.name };
            const props2 = [
                { path: 'bankId', regex: Resources.regex.uuid },
                { path: 'bankName', regex: Resources.regex.bank.name },
            ];

            should(val.validateProxy(value)).eql(valError);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            const { args: typeArgs } = validators.validateTypeNoThrow.lastCall;
            should(typeArgs).be.eql([value, Object, props1]);
            should(validators.validateContractObjectNoThrow.calledOnce).be.true('should call validateContractObjectNoThrow once');
            const { args: contractArgs } = validators.validateContractObjectNoThrow.lastCall;
            should(contractArgs).be.eql([value, Object, props2, null]);
        });

        it('should return undefined if validateTypeNoThrow andvalidateContractObjectNoThrow do not return any errors', () => {
            validators.validateTypeNoThrow.returns(undefined);
            validators.validateContractObjectNoThrow.returns(undefined);

            should(val.validateProxy({})).eql(undefined);
            should(validators.validateTypeNoThrow.calledOnce).be.true('should call validateTypeNoThrow once');
            should(validators.validateContractObjectNoThrow.calledOnce).be.true('should call validateContractObjectNoThrow once');
        });
    });

    describe('validateInternalStatuses', () => {
        it('should return empty array if no invalid items passed in', () => {
            const intStatuses = Object.values(dict.internalStatusValues);

            should(val.validateInternalStatuses(intStatuses)).eql([]);
        });

        it('should return empty array if no items passed in', () => {
            const intStatuses = [];

            should(val.validateInternalStatuses(intStatuses)).eql([]);
        });

        it('should return StatusCodeErrorItem if invalid items found', () => {
            const intStatuses = ['invalid'];

            const result = val.validateInternalStatuses(intStatuses);
            should(result).be.an.Array().of.length(intStatuses.length);
            const [error] = result;
            should(error).be.an.instanceOf(StatusCodeErrorItem);
            should(error).have.property('applicationCode', Resources.services.common.InvalidProperties);
            should(error).have.property('message', 'invalid internalStatus value');
            should(error).have.propertyByPath('params', 'internalStatuses').which.is.an.Array();
        });
    });
});
