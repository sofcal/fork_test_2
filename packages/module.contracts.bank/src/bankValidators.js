'use strict';

const Resources = require('@sage/bc-common-resources');
const { StatusCodeErrorItem } = require('@sage/bc-common-statuscodeerror');
const validators = require('@sage/bc-services-validators');

const _ = require('underscore');
const dict = require('./bankDictionary');

const bankValidators = (bank) => {
    const val = {
        validateNumber: (value) => _.isNumber(value) && !_.isNaN(value),

        isFormAuthorisation: () => bank.authorisationMechanism === dict.AuthorisationMechanism.form,

        validateMandatoryCustomerBankDetails: (value) => {
            const properties = [
                { path: 'name', custom: _.isString, optional: false },
                { path: 'value', custom: _.isString, optional: false },
                { path: 'validation', custom: _.isString, optional: false },
                { path: 'isAmendable', custom: _.isBoolean, optional: false }
            ];

            const valType = validators.validateTypeNoThrow(value, Object, { path: 'mandatoryCustomerBankDetails', prefix: 'Bank' });
            return valType ? [valType] : validators.validateContractObjectNoThrow(value, Object, properties);
        },

        validateAccountTypes: (value) => {
            const properties = [
                { path: 'name', regex: Resources.regex.bank.accountTypes, optional: true },
                { path: 'mandatoryCustomerBankDetails', nested: val.validateMandatoryCustomerBankDetails, optional: true }
            ];

            const valType = validators.validateTypeNoThrow(value, Object, { path: 'accountTypes', prefix: 'Bank' });
            return valType ? [valType] : validators.validateContractObjectNoThrow(value, Object, properties);
        },

        validateDataProvider: (dp) => _.contains(_.values(dict.dataProviders), dp),

        validateStatus: (status) => _.contains(_.values(dict.quarantineValidationStatus), status),

        validateTransactionTypes: (transactionTypes) => {
            const properties = [
                { path: 'code', custom: _.isString },
                { path: 'status', custom: val.validateStatus },
                { path: 'releasedCount', custom: val.validateNumber }
            ];

            return _.chain(transactionTypes)
                .map((transactionType) => validators.validateContractObjectNoThrow(transactionType, Object, properties, 'transactionTypes'))
                .flatten()
                .value();
        },

        validateQuarantine: (quarantine) => {
            const properties = [
                { path: 'forceQuarantine', custom: _.isBoolean },
                { path: 'transactionTypes', arrayCustom: val.validateTransactionTypes, allowEmptyArray: true }
            ];

            const valType = validators.validateTypeNoThrow(quarantine, Object, { path: 'quarantine', prefix: 'Bank' });
            return valType ? [valType] : validators.validateContractObjectNoThrow(quarantine, Object, properties, null);
        },

        validateRFHQuarantine: (quarantine) => {
            const properties = [
                { path: 'isQuarantined', custom: _.isBoolean },
                { path: 'releaseDate', custom: _.isDate, optional: true, allowNull: true },
            ];

            const valType = validators.validateTypeNoThrow(quarantine, Object, { path: 'quarantine', prefix: 'Bank' });
            return valType ? [valType] : validators.validateContractObjectNoThrow(quarantine, Object, properties, null, true);
        },

        validateRecentFileHistory: (recentFileHistory) => {
            const properties = [
                { path: 'timestamp', custom: _.isDate, optional: true, allowNull: true },
                { path: 'fileId', custom: _.isString },
                { path: 'fileName', custom: _.isString },
                { path: 'quarantine', nested: val.validateRFHQuarantine, optional: true, allowNull: true }
            ];

            const valType = validators.validateTypeNoThrow(recentFileHistory, Object, { path: 'quarantine', prefix: 'Bank' });
            return valType ? [valType] : validators.validateContractObjectNoThrow(recentFileHistory, Object, properties, null, true);
        },

        validateOffBoardingType: (type) => _.contains(_.values(dict.offBoardingTypes), type),

        validateOffBoardingMechanism: (offBoardingMechanism) => {
            const properties = [
                { path: 'type', custom: val.validateOffBoardingType },
                { path: 'instructions', custom: _.isString, optional: true, allowNull: true },
                { path: 'emailAddress', regex: Resources.regex.bank.emailAddress, optional: true, allowNull: true },
                { path: 'emailTitle', regex: Resources.regex.bank.offBoardingEmailTitle, optional: true, allowNull: true }
            ];

            const valType = validators.validateTypeNoThrow(offBoardingMechanism, Object, { path: 'offBoardingMechanism', prefix: 'Bank' });
            return valType ? [valType] : validators.validateContractObjectNoThrow(offBoardingMechanism, Object, properties, null);
        },

        validateInternal: (internal) => {
            const properties = [
                { path: 'longURL', custom: _.isBoolean, optional: true, allowNull: true },
                { path: 'minRequestedStartDate', custom: _.isDate, optional: true, allowNull: true }
            ];

            const valType = validators.validateTypeNoThrow(internal, Object, { path: 'internal', prefix: 'Bank' });
            return valType ? [valType] : validators.validateContractObjectNoThrow(internal, Object, properties, null);
        },

        validateProxy: (proxy) => {
            const properties = [
                { path: 'bankId', regex: Resources.regex.uuid },
                { path: 'bankName', regex: Resources.regex.bank.name },
            ];

            const valType = validators.validateTypeNoThrow(proxy, Object, { path: 'proxy', prefix: 'Bank' });
            return valType ? [valType] : validators.validateContractObjectNoThrow(proxy, Object, properties, null);
        },

        validateInternalStatuses: (internalStatuses) => {
            const invalidItems = _.reject(internalStatuses, (status) => _.contains(_.values(dict.internalStatusValues), status));
            if (invalidItems.length === 0) {
                return [];
            }
            return [new StatusCodeErrorItem(Resources.services.common.InvalidProperties, 'invalid internalStatus value', { internalStatuses })];
        },

        validateProvider: (provider) => {
            const properties = [
                { path: 'providerId', regex: Resources.regex.uuid, optional: true, allowNull: true },
                { path: 'authUrl', custom: _.isString, optional: true, allowNull: true }
            ];

            const valType = validators.validateTypeNoThrow(provider, Object, { path: 'provider', prefix: 'Bank' });
            return valType ? [valType] : validators.validateContractObjectNoThrow(provider, Object, properties, null);
        },
    };
    return val;
};

module.exports = bankValidators;
