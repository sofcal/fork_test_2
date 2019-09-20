'use strict';

const resources = require('@sage/bc-common-resources');
const { Rule } = require('@sage/bc-contracts-rule');
const { StatusCodeErrorItem, StatusCodeError } = require('@sage/bc-statuscodeerror');
const utils = require('@sage/bc-validators');
const serviceUtils = require('@sage/bc-services-utils');
const PredictedAction = require('@sage/bc-contracts-predictedaction');
const util = require('util');
const _ = require('underscore');
const { format } = util;
const httpMethod = require('@sage/bc-framework-httpmethod');

const DEFAULT_PAYEE = {
    payeeId: null,
    address1: null,
    address2: null,
    address3: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
    phoneNumber: null,
    payeeBankId: null,
    payeeAccountId: null
};
const DEFAULT_CATEGORY = {
    topLevelCategory: null,
    subCategory: null,
    categoryId: null,
    standardIndustrialCode: null
};

function Transaction(data) {
    if (data) {
        this.uuid = data.uuid;
        this.transactionType = data.transactionType;
        this.transactionStatus = data.transactionStatus;
        this.datePosted = data.datePosted;
        this.dateUserInitiated = data.dateUserInitiated;
        this.dateFundsAvailable = data.dateFundsAvailable;
        this.transactionAmount = data.transactionAmount;
        this.transactionId = data.transactionId;
        this.incrementedId = data.incrementedId || 0;
        this.correctionId = data.correctionId;
        this.correctionAction = data.correctionAction;
        this.checkNum = data.checkNum;
        this.referenceNumber = data.referenceNumber;
        this.name = data.name;
        this.extendedName = data.extendedName;
        this.payee = _.extend({}, DEFAULT_PAYEE, data.payee || {});
        this.coordinates = this.setCoordinatesDefaults(data.coordinates);
        this.narrative1 = data.narrative1;
        this.narrative2 = data.narrative2;
        this.currency = data.currency;
        this.category = _.extend({}, DEFAULT_CATEGORY, data.category || {});
        this.bankAccountId = data.bankAccountId;
        this.transactionIndex = data.transactionIndex;
        this.fileIdentificationNumber = data.fileIdentificationNumber;
        this.dateFileArrived = data.dateFileArrived;
        this.transactionHash = data.transactionHash;
        this.accountsPostings = data.accountsPostings || [];
        this.transactionNarrative = this.buildTransactionNarrative(data.transactionNarrative);
        this.internalProcessingStatus = data.internalProcessingStatus;
        this.raw = data.raw;
        this.validationStatus = data.validationStatus || Transaction.validationStatus.notValidated;
        this.actualAction = data.actualAction;
        this.providerAdditionalFields = data.providerAdditionalFields || [];
        this.predictedActions = _.map(data.predictedActions || [], (p) => (new PredictedAction(p)));
        if (data.aggregatorTransactionId !== undefined) {
            this.aggregatorTransactionId = data.aggregatorTransactionId;
        }
        this.created = data.created || new Date();      // represents field creation datetime, it differs of the automatically created my the framework.
    }
}

Transaction.Create = (...args) => {
    return new Transaction(...args);
};

Transaction.validate = function(transaction, noThrow, sm) {
    let skipModes = sm;
    if (transaction) {
        skipModes = skipModes || transaction.skipModes;
    }

    const validateNumber = (value) => _.isNumber(value) && !_.isNaN(value);
    const validateCategory = (value) => {
        // these should be allow null (not currently in master) - we need this to be null for HB patch
        const properties = [
            { path: 'topLevelCategory', custom: _.isString, optional: true, allowNull: true },
            { path: 'subCategory', custom: _.isString, optional: true, allowNull: true },
            { path: 'categoryId', custom: validateNumber, optional: true, allowNull: true },
            { path: 'standardIndustrialCode', regex: resources.regex.company.standardIndustrialCode, optional: true, allowNull: true }
        ];

        const valType = utils.validateTypeNoThrow(value, Object, { path: 'category', prefix: Transaction.name });
        return valType ? [valType] : utils.validateContractObjectNoThrow(value, Object, properties);
    };

    const validateCoordinates = (value) => {
        const properties = [
            { path: 'lat', custom: validateNumber },
            { path: 'long', custom: validateNumber }
        ];

        const valType = utils.validateTypeNoThrow(value, Object, { path: 'coordinates', prefix: Transaction.name });
        return valType ? [valType] : utils.validateContractObjectNoThrow(value, Object, properties);
    };

    const validatePayee = (value) => {
        const properties = [
            { path: 'payeeId', custom: _.isString, optional: true, allowNull: true },
            { path: 'address1', custom: _.isString, optional: true, allowNull: true },
            { path: 'address2', custom: _.isString, optional: true, allowNull: true },
            { path: 'address3', custom: _.isString, optional: true, allowNull: true },
            { path: 'city', custom: _.isString, optional: true, allowNull: true },
            { path: 'state', custom: _.isString, optional: true, allowNull: true },
            { path: 'postalCode', custom: _.isString, optional: true, allowNull: true },
            { path: 'country', regex: resources.regex.transaction.country, optional: true, allowNull: true },
            { path: 'phoneNumber', regex: resources.regex.transaction.phoneNumber, optional: true, allowNull: true },
            { path: 'payeeBankId', custom: _.isString, optional: true, allowNull: true },
            { path: 'payeeAccountId', custom: _.isString, optional: true, allowNull: true }
        ];

        const valType = utils.validateTypeNoThrow(value, Object, { path: 'payee', prefix: Transaction.name });
        return valType ? [valType] : utils.validateContractObjectNoThrow(value, Object, properties);
    };

    const validatePostingsInstructions = (value) => {
        const properties = [
            { path: 'type', custom: _.isString, optional: true, allowNull: true },
            { path: 'code', custom: _.isString, optional: true, allowNull: true },
            { path: 'name', custom: _.isString, optional: true, allowNull: true },
            { path: 'status', custom: _.isString, optional: true, allowNull: true },
            { path: 'value', custom: validateNumber, optional: true, allowNull: true }
        ];

        const valType = utils.validateTypeNoThrow(value, Object, { path: 'postings', prefix: Transaction.name });
        return valType ? [valType] : utils.validateContractObjectNoThrow(value, Object, properties);
    };

    const validateAccountsPostings = (value) => {
        const properties = [
            { path: 'createdBy', custom: _.isString, optional: true },
            { path: 'grossAmount', custom: validateNumber, optional: true },
            { path: 'netAmount', custom: validateNumber, optional: true },
            { path: 'taxAmount', custom: validateNumber, optional: true },
            { path: 'accountantNarrative', custom: _.isString, optional: true, allowNull: true },
            { path: 'postingInstructions', nested: validatePostingsInstructions, optional: true }
        ];

        const valType = utils.validateTypeNoThrow(value, Object, { path: 'accountsPostings', prefix: Transaction.name });
        return valType ? [valType] : utils.validateContractObjectNoThrow(value, Object, properties);
    };

    const validateRaw = (raw) => {
        const properties = [
            { path: 'fileName', custom: _.isString },
            { path: 'lineNumberFirst', custom: validateNumber },
            { path: 'lineNumberLast', custom: validateNumber },
            { path: 'lineContent', custom: _.isString },
            { path: 'transactionCode', custom: _.isString }
        ];

        const valType = utils.validateTypeNoThrow(raw, Object, { path: 'raw', prefix: Transaction.name });
        return valType ? [valType] : utils.validateContractObjectNoThrow(raw, Object, properties);
    };

    const validateActualActionPostingsInstructions = (postingInstructions) => {
        const items = [];
        _.each(postingInstructions, (postingInstruction) => {
            const properties = [
                { path: 'type', custom: _.isString },
                { path: 'userDefinedTypeName', custom: _.isString, optional: true, allowNull: true },
                { path: 'code', custom: _.isString, optional: true, allowNull: true },
                { path: 'name', custom: _.isString, optional: true, allowNull: true },
                { path: 'status', custom: _.isString, optional: true, allowNull: true },
                { path: 'value', custom: validateNumber, optional: true, allowNull: true },
                { path: 'description', custom: _.isString, optional: true, allowNull: true }
            ];
        items.push(...utils.validateContractObjectNoThrow(postingInstruction, Object, properties, 'postingInstructions'));
    });
        return items;
    };

    const validateActualActionAccountsPostings = (accountPostings) => {
        const items = [];
        _.each(accountPostings, (accountPosting) => {
            const properties = [
                { path: 'grossAmount', custom: validateNumber, optional: true },
                { path: 'netAmount', custom: validateNumber, optional: true },
                { path: 'taxAmount', custom: validateNumber, optional: true },
                { path: 'accountantNarrative', custom: _.isString, optional: true, allowNull: true },
                { path: 'postingInstructions', arrayCustom: validateActualActionPostingsInstructions, optional: true }
            ];
        items.push(...utils.validateContractObjectNoThrow(accountPosting, Object, properties, 'accountsPostings'));
    });
        return items;
    };

    const validateActualActionAccountsPosting = (value) => {
        const properties = [
            { path: 'accountsTransactionId', custom: _.isString, optional: true, allowNull: true },
            { path: 'type', custom: _.isString, optional: true, allowNull: true },
            { path: 'reference', custom: _.isString, optional: true, allowNull: true },
            { path: 'accountsPostings', arrayCustom: validateActualActionAccountsPostings },
        ];
        const valType = utils.validateTypeNoThrow(value, Object, { path: 'actualAction', prefix: Transaction.name });

        return valType ? [valType] : utils.validateContractObjectNoThrow(value, Object, properties);
    };

    const validateActualAction = (value) => {
        const properties = [
            { path: 'predictionId', regex: resources.regex.uuid, optional: true, allowNull: true  },
            { path: 'action', nested: validateActualActionAction }];

        const valType = utils.validateTypeNoThrow(value, Object, { path: 'actualAction', prefix: Transaction.name });
        return valType ? [valType] : utils.validateContractObject(value, Object, properties);
    };

    const validateActualActionAction = (value) => {
        const properties = [
            { path: 'actionType', custom: _.isString },
            { path: 'accountsPosting', nested: validateActualActionAccountsPosting }
        ];

        const valType = utils.validateTypeNoThrow(value, Object, { path: 'actualActionSction', prefix: Transaction.name });
        return valType ? [valType] : utils.validateContractObject(value, Object, properties);
    };
    const validateValidationStatus = (validationStatus) => _.contains(_.values(Transaction.validationStatus), validationStatus);

    const validateProviderAdditionalFields = (fields) => {
        const items = [];
        _.each(fields, (field) => {
            const properties = [
                { path: 'name', regex: resources.regex.transaction.providerAdditionalFields.name },
                { path: 'value', regex: resources.regex.transaction.providerAdditionalFields.value }
            ];

        items.push(...utils.validateContractObjectNoThrow(field, Object, properties, 'providerAdditionalFields'));
    });

        return items;
    };

    const validatePredictedActions = (predictedAction) => {
        return PredictedAction.validate(predictedAction, true);
    };

    const properties = [
        { path: 'uuid', regex: resources.regex.uuid, optional: true, allowNull: true },
        { path: 'transactionType', regex: resources.regex.transaction.transactionType },
        { path: 'transactionStatus', regex: resources.regex.transaction.transactionStatus },
        { path: 'datePosted', custom: _.isDate, optional: true, allowNull: true },
        { path: 'dateUserInitiated', custom: _.isDate, optional: true, allowNull: true },
        { path: 'dateFundsAvailable', custom: _.isDate, optional: true, allowNull: true },
        { path: 'transactionAmount', custom: validateNumber },
        { path: 'transactionId', regex: resources.regex.transaction.transactionId, optional: true, allowNull: true },
        { path: 'incrementedId', custom: validateNumber },
        { path: 'correctionId', regex: resources.regex.transaction.correctionId, optional: true, allowNull: true },
        { path: 'correctionAction', regex: resources.regex.transaction.correctionAction, optional: true, allowNull: true },
        { path: 'checkNum', custom: _.isString, optional: true, allowNull: true },
        { path: 'referenceNumber', custom: _.isString, optional: true, allowNull: true },
        { path: 'name', custom: _.isString, optional: true, allowNull: true },
        { path: 'extendedName', custom: _.isString, optional: true, allowNull: true },
        { path: 'bankAccountId', regex: resources.regex.uuid, optional: true, allowNull: true },
        { path: 'narrative1', custom: _.isString, optional: true, allowNull: true },
        { path: 'narrative2', custom: _.isString, optional: true, allowNull: true },
        { path: 'currency', custom: _.isString, optional: true, allowNull: true },
        { path: 'category', nested: validateCategory, optional: true, allowNull: true },
        { path: 'payee', nested: validatePayee, optional: true, allowNull: true },
        { path: 'coordinates', nested: validateCoordinates },
        { path: 'raw', nested: validateRaw, optional: true, allowNull: true },
        { path: 'validationStatus', custom: validateValidationStatus, optional: true, allowNull: true },
        { path: 'actualAction', nested: validateActualAction, optional: true, allowNull: true },
        { path: 'providerAdditionalFields', arrayCustom: validateProviderAdditionalFields, allowEmptyArray: true },
        { path: 'predictedActions', custom: validatePredictedActions, allowEmptyArray: true }
    ];

    if (!_.contains(skipModes, Transaction.updateModes.accountant)) {
        properties.push.apply(properties, [
            { path: 'internalProcessingStatus', regex: resources.regex.transaction.internalProcessingStatus, optional: true, allowNull: true },
            { path: 'accountsPostings', nested: validateAccountsPostings, optional: true, allowNull: true },
            { path: 'transactionNarrative', custom: _.isString, optional: true, allowNull: true }
        ]);
    }

    properties.push.apply(properties, [{ path: 'aggregatorTransactionId', custom: _.isString, optional: true, allowNull: true }]);

    if (noThrow) {
        // return object with errors in it instead of throwing.
        return utils.validateContractObjectNoThrow(transaction, Transaction, properties);
    }
    return utils.validateContractObject(transaction, Transaction, properties);
};

Transaction.getStringForHashing = (transaction, bankAccountNum, bankIdentifier) => {
    const checkField = (fieldName, fieldValue) => {
        if (_.isUndefined(fieldValue)) {
            const message = format(resources.services.transaction.InvalidHashComponentMessage, fieldName);
            const typeItem = new StatusCodeErrorItem(resources.services.transaction.InvalidHashComponent, message);
            throw new StatusCodeError([typeItem], 400);
        }
    };

    const dataFields = {
        bankAccountNum,
        bankIdentifier,
        datePosted: transaction.datePosted,
        transactionAmount: transaction.transactionAmount,
        transactionType: transaction.transactionType,
        transactionIndex: transaction.transactionIndex
    };

    if (transaction.aggregatorTransactionId !== undefined) {
        dataFields.aggregatorTransactionId = transaction.aggregatorTransactionId;
    } else {
        dataFields.fileIdentificationNumber = transaction.fileIdentificationNumber;
    }

    checkField('bankAccountNum', dataFields.bankAccountNum);
    checkField('bankIdentifier', dataFields.bankIdentifier);
    checkField('datePosted', dataFields.datePosted);
    checkField('transactionAmount', dataFields.transactionAmount);
    checkField('transactionType', dataFields.transactionType);
    checkField('transactionIndex', dataFields.transactionIndex);

    if (transaction.aggregatorTransactionId !== undefined) {
        checkField('aggregatorTransactionId', dataFields.aggregatorTransactionId);
    } else {
        checkField('fileIdentificationNumber', dataFields.fileIdentificationNumber);
    }

    return JSON.stringify(dataFields);
};

const p = Transaction.prototype;

p.validate = function() {
    Transaction.validate(this);
};

Transaction.filter = (d) => {
    const data = d;

    delete data.created;

    delete data.bankAccountId;
    delete data.transactionIndex;
    delete data.fileIdentificationNumber;
    delete data.dateFileArrived;
    delete data.raw;
    delete data.validationStatus;
    delete data.actualAction;
    delete data.internalProcessingStatus;

    data.transactionId = data.incrementedId;

    return data;
};

p.getStringForHashing = function(bankAccountNum, bankIdentifier) {
    return Transaction.getStringForHashing(this, bankAccountNum, bankIdentifier);
};

p.buildTransactionNarrative = function(narrative) {
    if (narrative) {
        return narrative;
    }
    const strings = [
        this.narrative1 ? this.narrative1 : '',
        this.narrative2 ? this.narrative2 : '',
        this.name ? this.name : '',
        this.referenceNumber ? this.referenceNumber : '',
        this.extendedName ? this.extendedName : '',
        this.payee && this.payee.payeeId ? this.payee.payeeId : '',
        this.checkNum ? this.checkNum : ''
    ];
    const trimmed = _.map(strings, (item) => item.toString().trim());
    return _.compact(trimmed).join(' ');
};

p.setCoordinatesDefaults = function(coordinates) {
    // 0 (zero) is falsey in JavaScript so checking to see if lat/long is not 0
    return (!coordinates || (!coordinates.lat && coordinates.lat !== 0) || (!coordinates.long && coordinates.long !== 0)) ? { lat: 0, long: 0 } : coordinates;
};

Transaction.updateModes = { accountant: 'accountant' };

Transaction.allowableRuleFields = [
    { field: 'transactionNarrative', operations: [Rule.operations.eq, Rule.operations.contains, Rule.operations.doesNotContain, Rule.operations.containsWords] },
    { field: 'transactionAmount', operations: [Rule.operations.eq, Rule.operations.gt, Rule.operations.lt, Rule.operations.gte, Rule.operations.lte] },
    { field: 'datePosted', operations: [Rule.operations.gt, Rule.operations.lt, Rule.operations.gte, Rule.operations.lte] },
    { field: 'transactionType', operations: [Rule.operations.eq] },
    { field: 'checkNum', operations: [Rule.operations.eq] },
    { field: 'currency', operations: [Rule.operations.eq] },
    { field: 'payee.payeeBankId', operations: [Rule.operations.eq] },
    { field: 'payee.payeeAccountId', operations: [Rule.operations.eq] },
    {
        field: '$baseType',
        operations: [Rule.operations.eq],
        handler: (transaction, match/* , op */) => {
        // only eq is supported for op; so we just assume it's eq. If you're adding an extra op for this allowable, make sure you check
        return match === 'CREDIT' ? transaction.transactionAmount >= 0 : transaction.transactionAmount < 0;
}
}
];

module.exports = Transaction;

Transaction.extend = (destination, source, method) => serviceUtils.extend(destination, source, method, (method === httpMethod.post ? postKeys : updateKeys), readOnlyKeys);

const _Keys = [
    // these fields can neither be created nor modified by the API client
    { canCreate: false, canUpdate: false, id: 'uuid' },
    { canCreate: false, canUpdate: false, id: 'raw' },
    { canCreate: false, canUpdate: false, id: 'validationStatus' },
    { canCreate: false, canUpdate: false, id: 'providerAdditionalFields' },
    { canCreate: false, canUpdate: false, id: 'predictedActions' },

    // these fields can be created but not updated by the API client
    { canCreate: true, canUpdate: false, id: 'transactionHash' },
    { canCreate: true, canUpdate: false, id: 'transactionType' },
    { canCreate: true, canUpdate: false, id: 'transactionStatus' },
    { canCreate: true, canUpdate: false, id: 'datePosted' },
    { canCreate: true, canUpdate: false, id: 'dateUserInitiated' },
    { canCreate: true, canUpdate: false, id: 'dateFundsAvailable' },
    { canCreate: true, canUpdate: false, id: 'transactionAmount' },
    { canCreate: true, canUpdate: false, id: 'correctionId' },
    { canCreate: true, canUpdate: false, id: 'correctionAction' },
    { canCreate: true, canUpdate: false, id: 'serverTransactionId' },
    { canCreate: true, canUpdate: false, id: 'checkNum' },
    { canCreate: true, canUpdate: false, id: 'referenceNumber' },
    { canCreate: true, canUpdate: false, id: 'name' },
    { canCreate: true, canUpdate: false, id: 'payee' },
    { canCreate: true, canUpdate: false, id: 'extendedName' },
    { canCreate: true, canUpdate: false, id: 'transactionIndex' },
    { canCreate: true, canUpdate: false, id: 'narrative1' },
    { canCreate: true, canUpdate: false, id: 'narrative2' },
    { canCreate: true, canUpdate: false, id: 'currency' },
    { canCreate: true, canUpdate: false, id: 'coordinates' },
    { canCreate: true, canUpdate: false, id: 'category' },
    { canCreate: true, canUpdate: false, id: 'actualAction' },
    // these fields can be created and updated by the API client
    { canCreate: true, canUpdate: true, id: 'transactionId' },
    { canCreate: true, canUpdate: true, id: 'transactionNarrative' },
    { canCreate: true, canUpdate: true, id: 'accountsPostings' },
];

const mapKeys = (keys, filterFunc) => _.chain(keys).filter(filterFunc).map((k) => k.id).value();

let postKeys = mapKeys(_Keys, (k) => k.canCreate);
let updateKeys = mapKeys(_Keys, (k) => k.canUpdate);
let readOnlyKeys = mapKeys(_Keys, (k) => !k.canUpdate);

Transaction.validationStatus = Object.freeze({
    notValidated: 'notValidated',
    manual: 'manual',
    auto: 'auto'
});
