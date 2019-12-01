'use strict';

const ruleSchema = require('./schemas/ruleSchema');
const FilterKeys = require('./api/FilterKeys');

const { HttpMethod } = require('@sage/bc-util-httpmethod');
const { extend, filter, validateType } = require('@sage/bc-contracts-util');
const { Mapper: StatusCodeErrorMapper } = require('@sage/bc-jsonschema-to-statuscodeerror');

const jsonschema = require('jsonschema');
const access = require('safe-access');
const _ = require('underscore');
const Big = require('bignumber.js');


class Rule {
    constructor(data) {
        if (data) {
            this.uuid = data.uuid;
            this.ruleName = data.ruleName;                                  // Custom name for this rule, unique at bank account level
            this.ruleRank = data.ruleRank || null;                          // Rank of this rule, which determines the order in which rules are checked against data items
            this.ruleConditions = data.ruleConditions || [];                // Array of rule conditions, ALL of which need to be true to invoke the resulting rule action(s)
            this.ruleActions = buildRuleActionsImpl(data.ruleActions);      // Array of rule actions which are applied if ALL rule conditions are true
            this.ruleAdditionalFields = data.ruleAdditionalFields || [];    // Array of client-supplied meta data that will be applied at the transaction level
            this.status = data.status || Rule.statuses.active;              // status of this rule
            this.targetType = data.targetType;
            this.ruleType = data.ruleType;
            this.productId = data.productId;
            this.globalRuleId = data.globalRuleId || null;
            this.ruleCounts = data.ruleCounts || { success: 0, fail: 1, applied: 0 };
        }
    }

    static Create(...args) {
        return new Rule(...args);
    }

    static createFromActualAction(...args) {
        return createFromActualActionImpl(...args);
    }

    validate(noThrow = false) {
        return Rule.validate(this, noThrow);
    }

    // upper cased naming to support ProviderAPI
    static Validate(...args) {
        return Rule.validate(...args);
    }

    // lower cased naming for legacy Banking Cloud
    static validate(rule, noThrow) {
        const typeItem = validateType({ obj: rule, Type: Rule, noThrow });
        if (typeItem) {
            // can only get here if noThrow was true
            return ([typeItem]);
        }

        const result = jsonschema.validate(rule, ruleSchema, { propertyName: Rule.name });
        const last = _.last(rule.ruleActions);
        if (last && _.isNumber(last.splitPercentage) && last.splitPercentage !== 100) {
            const additional = { custom: true, message: 'Rule.ruleActions: invalid final splitPercentage', params: {} };
            result.errors.push(additional);
        }

        if (result.errors.length > 0) {
            if (noThrow) {
                return StatusCodeErrorMapper.toStatusCodeErrorItems(result, Rule, rule);
            }

            throw StatusCodeErrorMapper.toStatusCodeError(result, Rule, rule);
        }

        return noThrow ? [] : undefined;
    }

    static extend(destination, source, method) {
        const sourceWhitelist = HttpMethod.IsPost(method) ? FilterKeys.post : FilterKeys.update;
        const destinationWhitelist = HttpMethod.IsPut(method) ? FilterKeys.readOnly : null;

        return extend({ destination, source, sourceWhitelist, destinationWhitelist });
    }

    static GetRuleTypesToProcess(...args) {
        return getRuleTypesToProcessImpl(...args);
    }

    static filter(rule) {
        return filter({ source: rule, sourceBlacklist: FilterKeys.filtered });
    }

    // TODO: Should this be here? Or should it be on the RuleBucket?
    static sortRulesByRank(rules) {
        return _.sortBy(rules, (item) => item.ruleRank || Number.MAX_SAFE_INTEGER);
    }
}

const buildRuleActionsImpl = function(actionsArray) {
    const arrayToReturn = [];

    // TODO: can surely be optimised?
    if (actionsArray && actionsArray.length) {
        // TODO: map?
        _.each(actionsArray, (action) => {
            // if splitAmount === 0, then entirely ignore it and use the rulePercentage instead
            // if splitAmount > 0, then use this value and entirely ignore the rulePercentage (i.e. don’t try to validate it!)

            let actionObj = {
                splitAmount: action.splitAmount === 0 ? undefined : action.splitAmount,
                splitPercentage: action.splitAmount > 0 ? undefined : action.splitPercentage,
                accountantNarrative: action.accountantNarrative || undefined,
                accountsPostings: action.accountsPostings || undefined
            };

            // TODO: we're iterating when we could just create and assign in a single if
            actionObj = _.pick(actionObj, (value) => value !== undefined);

            arrayToReturn.push(actionObj);
        });
    }

    return arrayToReturn;
};

// TODO: This logic shouldn't be in this module. It's specific to the consuming application; so should exist as a util in those projects
const getRuleTypesToProcessImpl = (bankAccount) => {
    const ruleTypesToProcess = [Rule.ruleTypes.user, Rule.ruleTypes.accountant];
    const processAutoRules = access(bankAccount, 'featureOptions.autoCreateRules');
    if (processAutoRules) {
        ruleTypesToProcess.push(Rule.ruleTypes.feedback);
        ruleTypesToProcess.push(Rule.ruleTypes.global);
    }
    return ruleTypesToProcess;
};

// TODO: This logic shouldn't be in this module. It's specific actualActions and ML; o should exist as a util in that project
const createFromActualActionImpl = (transaction, narrativeCriteria) => {
    const actualAccountsPostings = access(transaction, 'actualAction.action.accountsPosting.accountsPostings');
    if ((actualAccountsPostings === null) || actualAccountsPostings.length === 0) {
        return null;
    }

    const ruleData = {};
    ruleData.ruleName = `Feedback Rule: ${narrativeCriteria}`;
    ruleData.ruleName = ruleData.ruleName.substring(0, 200);
    ruleData.ruleRank = 1;

    ruleData.ruleConditions = [{
        ruleField: 'transactionNarrative',
        ruleOperation: Rule.operations.containsWords,
        ruleCriteria: narrativeCriteria,
    }];

    let amountToSplit = new Big(transaction.transactionAmount);
    const ruleActions = [];

    _.each(actualAccountsPostings, (actualAccountsPosting) => {
        const ruleAction = {};

        ruleAction.splitPercentage = (new Big(actualAccountsPosting.grossAmount)).div(amountToSplit).times(100).toNumber();

        if (ruleAction.splitPercentage.toString().length >= 15) {
            // can't even construct a big number with more than 15 significant DP
            const splitPercentageTrunc = ruleAction.splitPercentage.toString().substring(0, 15);
            // eslint-disable-next-line no-param-reassign
            ruleAction.splitPercentage = parseFloat(splitPercentageTrunc);
        }
        amountToSplit -= (new Big(amountToSplit)).times(ruleAction.splitPercentage).div(100).round(2);

        ruleAction.accountantNarrative = actualAccountsPosting.accountantNarrative;

        const ruleAccountsPostingInstructions = [];
        _.each(actualAccountsPosting.postingInstructions, (actualPostingInstr) => {
            const ruleAccountsPostingInstruction = {};
            ruleAccountsPostingInstruction.type = actualPostingInstr.type;
            ruleAccountsPostingInstruction.code = actualPostingInstr.code;
            ruleAccountsPostingInstructions.push(ruleAccountsPostingInstruction);
        });
        ruleAction.accountsPostings = ruleAccountsPostingInstructions;
        ruleActions.push(ruleAction);
    });

    ruleData.ruleActions = ruleActions;
    ruleData.ruleStatus = 'Active';
    ruleData.ruleType = 'Feedback';
    ruleData.targetType = 'Transaction';

    return new Rule(ruleData);
};

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
