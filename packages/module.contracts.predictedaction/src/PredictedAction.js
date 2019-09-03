'use strict';

const predictedActionSchema = require('./schemas/predictedActionSchema');

const { Rule } = require('@sage/bc-contracts-rule');
const { validateType } = require('@sage/bc-contracts-util');
const { Mapper: StatusCodeErrorMapper } = require('@sage/bc-jsonschema-to-statuscodeerror');

const jsonschema = require('jsonschema');
const access = require('safe-access');
const _ = require('underscore');
const uuidGen = require('uuid');

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
            //
            this.predictionId = data.predictionId || null;
            this.score = (_.isNumber(data.score) && !_.isNaN(data.score)) ? data.score : null;
            this.source = data.source || null;
            this.rules = _.map(data.rules || [], (rule) => _.extend({}, RULE_TEMPLATE, rule));
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
            predictionId: uuidGen.v4(),
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

    static validate(predictedAction, noThrow) {
        const typeItem = validateType({ obj: predictedAction, Type: PredictedAction, noThrow });
        if (typeItem) {
            // can only get here if noThrow was true
            return ([typeItem]);
        }

        const result = jsonschema.validate(predictedAction, predictedActionSchema, { propertyName: PredictedAction.name });
        if (result.errors.length > 0) {
            if (noThrow) {
                return StatusCodeErrorMapper.toStatusCodeErrorItems(result);
            }

            throw StatusCodeErrorMapper.toStatusCodeError(result);
        }

        return noThrow ? [] : undefined;
    }
}

PredictedAction.sourceTypes = _.extend({}, Rule.ruleTypes, { accountantManual: 'Accountant Manual' });
PredictedAction.matchTypes = {
    full: 'full',
    partial: 'partial',
    overwritten: 'overwritten'
};

module.exports = PredictedAction;
