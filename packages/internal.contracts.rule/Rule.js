'use strict';

const jsonschema = require('jsonschema');
const ruleSchema = require('./schemas/ruleSchema');
const { StatusCodeError, StatusCodeErrorItem, utils, httpMethod } = require('./_bankDrive');
const access = require('safe-access');
const _ = require('underscore');

class Rule {
    constructor(data) {
        const self = this;

        if (data) {
            self.uuid = data.uuid;
            self.ruleName = data.ruleName;                // Custom name for this rule, unique at bank account level
            self.ruleRank = data.ruleRank || null;
            self.ruleConditions = data.ruleConditions || [];    // Array of rule conditions, ALL of which need to be true to invoke the resulting rule action(s)
            self.ruleActions = buildRuleActionsImpl(self, data.ruleActions);       // Array of rule actions which are applied if ALL rule conditions are true
            self.status = data.status || Rule.statuses.active;
            self.targetType = data.targetType;
            self.ruleType = data.ruleType;
            self.productId = data.productId;
            self.globalRuleId = data.globalRuleId || undefined;
            self.ruleCounts = data.ruleCounts || { success: 0, fail: 1, applied: 0 };
        }
    }

    static Create(...args) {
        return new Rule(...args);
    }

    validate(noThrow = false) {
        return Rule.validate(this, noThrow);
    }

    static validate(...args) {
        return validateImpl(...args);
    }

    static extend(...args) {
        return extendImpl(this, ...args);
    }

    static GetRuleTypesToProcess(...args) {
        return getRuleTypesToProcessImpl(this, ...args);
    }

    static filter(...args) {
        return filterImpl(this, ...args);
    }

    static sortRulesByRank(...args) {
        return sortRulesByRankImpl(this, ...args);
    }

}

const filterImpl = function(self, data) {
    /* eslint-disable no-param-reassign */
    delete (data.created);
    delete (data.updated);
    delete (data.etag);
    delete (data.targetType);
    delete (data.productId);
    delete (data.ruleCounts);
    delete (data.globalRuleId);
    /* eslint-enable no-param-reassign */
    return data;
};

const sortRulesByRankImpl = function(self, rules) {
    return _.sortBy(rules, (item) => item.ruleRank || Number.MAX_SAFE_INTEGER);
};

const validateImpl = function(rule, noThrow) {

    const typeItem = utils.validateTypeNoThrow(rule, Rule);
    if(typeItem)
        throw new StatusCodeError([typeItem], 400);

    let result = jsonschema.validate(rule, ruleSchema);
    if (result.errors.length > 0) {
        if (noThrow) {
            return createErrorItems(result.errors, rule)
        } else {
            const error = createError(result.errors, rule);
            throw error;
        }
    }
    return true;
};

const createError = (errCollection, rule) => {
    return new StatusCodeError(createErrorItems(errCollection, rule), 400);
};

const createErrorItems = (errCollection, rule) => {
    const errorItems = [];
    _.each(errCollection, (err) => {
        let invalidValue = {};
        const dotSeparated = buildDotSeparatedString(err.property);
        const prop = resolvePath(dotSeparated, rule);
        if (_.isArray(prop)) {
            invalidValue[dotSeparated] = prop[0];
        } else {
            invalidValue[dotSeparated] = prop;
        }
        const errorText = `Rule.${dotSeparated}: ${invalidValue[dotSeparated]}`;
        errorItems.push(new StatusCodeErrorItem('InvalidProperties', errorText, invalidValue));
    });
    return errorItems;
};

const resolvePath = (path, obj=self, separator='.') => {
    var properties = Array.isArray(path) ? path : path.split(separator)
    return properties.reduce((prev, curr) => prev && prev[curr], obj)
};

const buildDotSeparatedString = (dotSeparated) => {
    dotSeparated = dotSeparated.split('instance.').join('');
    dotSeparated = dotSeparated.split('[').join('.');
    dotSeparated = dotSeparated.split(']').join('');
    if (dotSeparated.indexOf('.') > 0) {
        dotSeparated = dotSeparated.substring(0, dotSeparated.indexOf('.'));
    }
    return dotSeparated;
};

const extendImpl = (self, destination, source, method) => {
    return utils.extend(destination, source, method, (method === httpMethod.post ? postKeys : updateKeys), readOnlyKeys);
};

const buildRuleActionsImpl = function(self, actionsArray) {
    const arrayToReturn = [];

    if (actionsArray && actionsArray.length) {
        _.each(actionsArray, (action) => {
            // if splitAmount === 0, then entirely ignore it and use the rulePercentage instead
            // if splitAmount > 0, then use this value and entirely ignore the rulePercentage (i.e. don’t try to validate it!)

            let actionObj = {
                splitAmount: action.splitAmount === 0 ? undefined : action.splitAmount,
                splitPercentage: action.splitAmount > 0 ? undefined : action.splitPercentage,
                accountantNarrative: action.accountantNarrative || undefined,
                accountsPostings: action.accountsPostings || undefined
            };

            actionObj = _.pick(actionObj, (value) => value !== undefined);

            arrayToReturn.push(actionObj);
        });
    }

    return arrayToReturn;
};

const getRuleTypesToProcessImpl = (self, bankAccount) => {
    const ruleTypesToProcess = [Rule.ruleTypes.user, Rule.ruleTypes.accountant];
    const processAutoRules = access(bankAccount, 'featureOptions.autoCreateRules');
    if (processAutoRules) {
        ruleTypesToProcess.push(Rule.ruleTypes.feedback);
        ruleTypesToProcess.push(Rule.ruleTypes.global);
    }
    return ruleTypesToProcess;
};

const _Keys = [
    // these fields can neither be created nor modified by the API client
    { canCreate: false, canUpdate: false, id: 'uuid' },
    { canCreate: false, canUpdate: false, id: 'targetType' },
    { canCreate: false, canUpdate: false, id: 'productId' },
    { canCreate: false, canUpdate: false, id: 'counts' },
    { canCreate: false, canUpdate: false, id: 'globalRuleId' },

    // these fields can be created and updated by the API client
    { canCreate: true, canUpdate: true, id: 'ruleName' },
    { canCreate: true, canUpdate: true, id: 'ruleRank' },
    { canCreate: true, canUpdate: true, id: 'ruleConditions' },
    { canCreate: true, canUpdate: true, id: 'ruleActions' },
    { canCreate: true, canUpdate: true, id: 'status' },
    { canCreate: true, canUpdate: true, id: 'entities' },

    // these fields can be created but not updated by the API client
    { canCreate: true, canUpdate: false, id: 'ruleType' },
];

const mapKeys = (keys, filterFunc) => _.chain(keys).filter(filterFunc).map((k) => k.id).value();

let postKeys = mapKeys(_Keys, (k) => k.canCreate);
let updateKeys = mapKeys(_Keys, (k) => k.canUpdate);
let readOnlyKeys = mapKeys(_Keys, (k) => !k.canUpdate);

Rule.statuses = Object.freeze({ active: 'active', inactive: 'inactive' });
Rule.operations = Object.freeze({
    containsWords: 'containsWords',
    contains: 'contains',
    doesNotContain: 'notcontains',
    eq: 'eq',
    gt: 'gt',
    lt: 'lt',
    gte: 'ge',
    lte: 'le'
});
Rule.ruleTypes = {
    user: 'User',
    accountant: 'Accountant',
    feedback: 'Feedback',
    global: 'Global'
};

module.exports = Rule;