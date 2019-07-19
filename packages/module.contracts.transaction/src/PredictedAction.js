'use strict';

const resources = require('@sage/bc-common-resources');
const utils = require('@sage/bc-validators');
const Rule = require('@sage/bc-rule');
const _ = require('underscore');
const access = require('safe-access');
const commonUuid = require('uuid');

const ACCOUNTS_POSTING_TEMPLATE = {
    createdBy: null,
    grossAmount: null,
    netAmount: null,
    taxAmount: null,
    accountantNarrative: null,
    postingInstructions: null
};

const POSTING_INSTRUCTION_TEMPLATE = {
    type: null,
    userDefinedTypeName: null,
    code: null,
    name: null,
    status: null,
    value: null,
    description: null,
};

const RULE_TEMPLATE = {
    ruleId: null,
    ruleRank: null,
    match: null
};

class PredictedAction {
    constructor(data) {
        if (data) {
            this.predictionId = data.predictionId || null;
            this.score = (_.isNumber(data.score) && !_.isNaN(data.score)) ? data.score : null;
            this.source = data.source || null;
            this.rules = _.map(data.rules, (rule) => _.extend({}, RULE_TEMPLATE, rule));
            this.action = {
                type: access(data, 'action.type') || null,
                reference: access(data, 'action.reference') || null,
                ruleAdditionalFields: access(data, 'action.ruleAdditionalFields') || [],
                accountsPostings: _.map(access(data, 'action.accountsPostings'), (accountsPosting) => {
                    // eslint-disable-next-line no-param-reassign
                    const postingInstructions = _.map(accountsPosting.postingInstructions, (i) => _.extend({}, POSTING_INSTRUCTION_TEMPLATE, i));
            return _.extend({}, ACCOUNTS_POSTING_TEMPLATE, accountsPosting, { postingInstructions });
        })
        };
        }
    }

    static Create(...args) {
    return new PredictedAction(...args);
}

static CreateForPostingsAndRule(accountsPostings, { uuid = null, ruleCounts = { success: 0, fail: 1, applied: 0 }, ruleRank = null, ruleType = 'unknown', ruleAdditionalFields = [] } = {}) {
    const convertedRule = { ruleId: uuid, ruleRank, match: PredictedAction.matchTypes.full };
    let score = 100;
    if (ruleType === Rule.ruleTypes.feedback || ruleType === Rule.ruleTypes.global) {
        score = 100 * (ruleCounts.success / (ruleCounts.success + ruleCounts.fail));
    }
    const data = {
        predictionId: commonUuid.v4(),
        score,
        source: ruleType,
        rules: [convertedRule],
        action: {
            ruleAdditionalFields,
            accountsPostings
        }
    };
    return new PredictedAction(data);
}

validate(noThrow = false) {
    return PredictedAction.validate(this, noThrow);
}

static validate(...args) {
    return validateImpl(...args);
}
}

const validateNumber = (value) => _.isNumber(value) && !_.isNaN(value);

const validateImpl = (predictedAction, noThrow) => {
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

    const validatePredictedActionsRules = (rules) => {
        const items = [];
        _.each(rules, (rule) => {
            const properties = [
                { path: 'ruleId', regex: resources.regex.uuid, optional: true, allowNull: true },
                { path: 'ruleRank', custom: validateNumber, optional: true, allowNull: true },
                { path: 'match', custom: _.isString, optional: true, allowNull: true }
            ];
        items.push(...utils.validateContractObjectNoThrow(rule, Object, properties, 'rules'));
    });
        return items;
    };

    const validateRuleAdditionalFields = (fields) => {
        const items = [];
        _.each(fields, (field) => {
            const properties = [
                { path: 'name', regex: resources.regex.rule.additionalFields.name },
                { path: 'value', regex: resources.regex.rule.additionalFields.value }
            ];

        items.push(...utils.validateContractObjectNoThrow(field, Object, properties, 'ruleAdditionalFields'));
    });
        return items;
    };

    const validatePredictedActionActionAccountsPostings = (accountsPostings) => {
        const items = [];
        _.each(accountsPostings, (accountPosting) => {
            const properties = [
                { path: 'createdBy', custom: _.isString, optional: true },
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

    const validatePredictedActionAction = (action) => {
        const properties = [
            { path: 'type', custom: _.isString, optional: true },
            { path: 'reference', custom: _.isString, optional: true },
            { path: 'ruleAdditionalFields', arrayCustom: validateRuleAdditionalFields, allowEmptyArray: true },
            {
                path: 'accountsPostings',
                arrayCustom: validatePredictedActionActionAccountsPostings,
                optional: true,
                allowNull: true,
                allowEmptyArray: true
            }
        ];
        const valType = utils.validateTypeNoThrow(action, Object, { path: 'action', prefix: PredictedAction.predictionId });
        return valType ? [valType] : utils.validateContractObjectNoThrow(action, Object, properties);
    };

    const properties = [
        { path: 'predictionId', regex: resources.regex.uuid, optional: true, allowNull: true },
        { path: 'score', custom: validateNumber, optional: true, allowNull: true },
        { path: 'source', custom: (value) => _.contains(PredictedAction.sourceTypes, value), optional: true, allowNull: true },
        { path: 'rules', arrayCustom: validatePredictedActionsRules, optional: true, allowNull: true },
        { path: 'action', nested: validatePredictedActionAction, optional: true, allowNull: true }
    ];

    if (noThrow) {
        // return object with errors in it instead of throwing.
        return utils.validateContractObjectNoThrow(predictedAction, PredictedAction, properties);
    }

    return utils.validateContractObject(predictedAction, PredictedAction, properties);
};

PredictedAction.sourceTypes = _.extend({}, Rule.ruleTypes, { accountantManual: 'Accountant Manual' });
PredictedAction.matchTypes = {
    full: 'full',
    partial: 'partial',
    overwritten: 'overwritten'
};

module.exports = PredictedAction;
