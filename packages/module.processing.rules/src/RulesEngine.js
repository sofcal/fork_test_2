'use strict';

const TaxCalculator = require('./TaxCalculator');
const generateRuleRegExp = require('./generateRuleRegExp');

const { Rule } = require('@sage/bc-contracts-rule');
const { PredictedAction } = require('@sage/bc-contracts-predictedaction');

const access = require('safe-access');
const Big = require('bignumber.js');
const Promise = require('bluebird');
const _ = require('underscore');

/**
 * NOTE: DO NOT CONVERT TO ES6. Performance is very important in this class, and while ES6 classes don't introduce too much
 *  of a hit, our standard pattern for promise wrapping ES6 class functions does.
 */
function RulesEngine(activity) {
    const self = this;

    self._activity = activity;
    self.taxCalculator = new TaxCalculator();
}

RulesEngine.Create = (...args) => {
    return new RulesEngine(...args);
};

const p = RulesEngine.prototype;

p.processRules = Promise.method(function(transactions, rules, entities, /* !bankAccountIsManaged */ isAccountOwnerRules, typesToProcess = [Rule.ruleTypes.user, Rule.ruleTypes.accountant], customHandlers = {}, disableRuleWildcards = false) {
    const self = this;
    const funcName = 'processRules';

    const bankAccountId = access(transactions, '[0].bankAccountId');

    self._activity.log('info', { function: funcName, msg: 'started', bankAccountId, count: transactions.length, isAccountOwnerRules, disableRuleWildcards, typesToProcess });

    // eslint-disable-next-line no-param-reassign
    rules = _.filter(rules, (rule) => typesToProcess.includes(rule.ruleType));

    // ensure rules are sorted by rank before we start
    if (rules) {
        // eslint-disable-next-line no-param-reassign
        rules = Rule.sortRulesByRank(rules);
    }

    const hasTransactions = transactions && transactions.length;
    const hasRules = rules && rules.length;
    const hasEntities = isAccountOwnerRules ? hasRules : entities && entities.length;

    if (!hasTransactions || !hasRules || !hasEntities) {
        const transactionsLength = transactions ? transactions.length : -1; // sets to -1 if no param passed
        const rulesLength = rules ? rules.length : -1; // sets to -1 if no param passed
        const entitiesLength = entities ? entities.length : -1; // sets to -1 if no param passed
        self._activity.log('info', {
            function: funcName,
            msg: 'ended - nothing to process',
            params: {
                transactions: transactionsLength, rules: rulesLength, entities: entitiesLength
            },
            bankAccountId
        });

        return transactions;
    }

    const checkFunctionsCache = {};

    _.each(transactions, (transaction) => {
        const { transactionHash } = transaction;
        return _.find(rules, (rule) => {
            try {
                return self.isMatch(transaction, rule, checkFunctionsCache, customHandlers, disableRuleWildcards) && self.tryAttachPostings(transaction, rule, entities, isAccountOwnerRules);
            } catch (err) {
                const error = err.message || err;
                self._activity.log('error', {
                    function: funcName,
                    msg: 'error attaching postings for rule',
                    bankAccountId,
                    transactionHash,
                    params: { error }
                });
                // at the moment we do nothing with failed rules, later we might want to expose this to a client API
                return false;
            }
        });
    });

    self._activity.log('info', { function: 'processRules', msg: 'ended', bankAccountId });

    return transactions;
});

p.tryAttachPostings = function(transaction, rule, entities, isAccountOwnerRules) {
    const self = this;

    if (!rule || !rule.ruleActions || rule.targetType !== 'Transaction') {
        throw new Error('invalid rule or targetType');
    }

    if (rule.status !== Rule.statuses.active) {
        throw new Error('rule is not active');
    }

    let bRemainder = new Big(transaction.transactionAmount);
    const accountsPostings = [];
    const len = rule.ruleActions.length;

    _.each(rule.ruleActions, (ra, i) => {
        const last = i === len - 1;
        const split = self.calculateSplit(ra, bRemainder, last);
        ({ bRemainder } = split);

        const amount = split.bAmount.round(2).toNumber();
        if (!amount) {
            return; // we don't add zero value lines
        }

        const posting = {
            createdBy: `auto: ${rule.ruleName}`,
            grossAmount: amount,
            netAmount: amount,
            taxAmount: 0,

            accountantNarrative: ra.accountantNarrative,
            postingInstructions: []
        };

        let taxVal = 0;
        _.each(ra.accountsPostings, (ap) => {
            if (isAccountOwnerRules) {
                if (!ap.type || !ap.code) {
                    throw new Error('rule has no accountsPostings');
                }
                posting.postingInstructions.push(ap);
            } else {
                const entity = _.find(entities, (e) => {
                    return e.entityType === ap.type && e.entityCode === ap.code;
                });
                if (!entity) {
                    throw new Error('entity not found for rule');
                }

                taxVal = entity.entityValue || taxVal;
                posting.postingInstructions.push(mapEntity(entity));
            }
        });

        if (taxVal) {
            const mod = amount < 0 ? -1 : 1;
            const tr = self.taxCalculator.calcTAX(Math.abs(amount), taxVal, 'GBR');
            posting.netAmount = tr.net * mod;
            posting.taxAmount = tr.tax * mod;
        }

        accountsPostings.push(posting);
    });

    rule.ruleCounts = rule.ruleCounts || { applied: 0 }; // eslint-disable-line no-param-reassign
    rule.ruleCounts.applied += 1; // eslint-disable-line no-param-reassign

    transaction.accountsPostings = accountsPostings; // eslint-disable-line no-param-reassign
    transaction.predictedActions = []; // eslint-disable-line no-param-reassign
    if (accountsPostings.length) {
        const predictedAction = PredictedAction.CreateForPostingsAndRule(accountsPostings, rule);
        transaction.predictedActions.push(predictedAction);
    }
    return true;
};

let mapEntity = function(entity) {
    const mapped = {
        code: entity.entityCode,
        name: entity.entityName,
        type: entity.entityType
    };

    if (entity.entityStatus) {
        mapped.status = entity.entityStatus;
    }
    if (entity.entityValue) {
        mapped.value = entity.entityValue;
    }

    return mapped;
};

p.calculateSplit = function(ruleAction, bRemainder, last) {
    // will contain Big numbers
    const ret = {/* Big:bRemainder, Big:bAmount */};

    let splitPercentageIsNumber = _.isNumber(ruleAction.splitPercentage);
    const splitAmountIsNumber = _.isNumber(ruleAction.splitAmount);

    if (splitPercentageIsNumber && ruleAction.splitPercentage.toString().length >= 15) {
        // can't even construct a big number with more than 15 significant DP
        const splitPercentageTrunc = ruleAction.splitPercentage.toString().substring(0, 15);
        // eslint-disable-next-line no-param-reassign
        ruleAction.splitPercentage = parseFloat(splitPercentageTrunc);
    }

    if (!splitPercentageIsNumber && !splitAmountIsNumber) {
        // eslint-disable-next-line no-param-reassign
        ruleAction.splitPercentage = 100;
        splitPercentageIsNumber = true;
    }

    if (bRemainder.isNaN() || (!last && bRemainder.abs().lessThan(0.01))) {
        throw new Error(`invalid remainder on split: ${bRemainder.toNumber()}`);
    }

    if (splitPercentageIsNumber) {
        const invalidLastPercentage = last && ruleAction.splitPercentage !== 100;
        if (invalidLastPercentage) {
            throw new Error(`invalid split percentage: ${ruleAction.splitPercentage}`);
        }

        const bMultiplier = new Big(ruleAction.splitPercentage).div(100);
        const bAmount = bRemainder.mul(bMultiplier).round(2);
        // eslint-disable-next-line no-param-reassign
        bRemainder = bRemainder.minus(bAmount);

        ret.bAmount = bAmount;
        ret.bRemainder = bRemainder;
    } else if (splitAmountIsNumber) {
        const invalidLastAmount = last && !bRemainder.abs().eq(ruleAction.splitAmount);
        const invalidAmount = !last && bRemainder.abs().lessThan(ruleAction.splitAmount);

        if (invalidLastAmount || invalidAmount) {
            const message = invalidLastAmount ? 'invalid absolute amount on last split: ' : 'invalid absolute amount on split: ';
            throw new Error(message + bRemainder.toNumber());
        }

        const mod = bRemainder.lessThan(0) ? -1 : 1;
        ret.bAmount = new Big(ruleAction.splitAmount * mod);
        ret.bRemainder = bRemainder.minus(ruleAction.splitAmount * mod);
    }

    return ret;
};

p.isMatch = function(transaction, rule, checkFunctionsCache, customHandlers, disableRuleWildcards) {
    const self = this;

    let matched = true;
    _.each(rule.ruleConditions, (condition) => {
        if (!matched) {
            return;
        }

        const field = access(transaction, condition.ruleField);
        const match = condition.ruleCriteria;
        const op = condition.ruleOperation;

        /**
         * for performance reasons we pass in an object (checkFunctionsCache) which contains previously used check functions for this
         *  set of transactions. That way, if we're comparing the same field multiple times, we don't have to continuously examine the
         *  type of the field.
         */

            // we don't cache the custom handlers on the checkFunctionsCache, as it would be no more efficient and would prevent us knowing
            //  which property to pass to it (transaction vs field
        const custom = customHandlers[condition.ruleField];
        // eslint-disable-next-line no-param-reassign
        const func = custom || checkFunctionsCache[condition.ruleField] || (checkFunctionsCache[condition.ruleField] = self.getCheckFunc(field));

        if (!func) {
            self._activity.log('info', {
                function: 'isMatch',
                msg: 'could not find check function for field',
                params: { fieldName: condition.ruleField, fieldValue: field, type: typeof (field) },
                bankAccountId: transaction.bankAccountId,
                transactionHash: transaction.transactionHash
            });
        }

        // deliberate bitwise operator. 'matched' will turn to false as soon as one of the func calls returns false
        matched &= func(custom ? transaction : field, match, op, disableRuleWildcards); // eslint-disable-line no-bitwise
    });

    return !!matched;
};

p.getCheckFunc = function(field) {
    let ret;
    if (_.isUndefined(field) || _.isNull(field)) {
        ret = undefined;
    } else if (_.isNumber(field)) {
        ret = checkNumberField;
    } else if (_.isDate(field)) {
        ret = checkDateField;
    } else if (_.isString(field)) {
        ret = checkStringField;
    }

    return ret;
};

const checkStringField = (field, match, op, disableRuleWildcards) => {
    const regex = generateRuleRegExp(match, op, disableRuleWildcards);
    const matches = regex.test(field);

    return (op === Rule.operations.contains || op === Rule.operations.eq || op === Rule.operations.containsWords) ? matches : !matches;
};

const checkDateField = (field, match, op, disableRuleWildcards, subOp) => {
    let fieldNumeric;
    let matchNumeric = match;
    switch (subOp) {
        case 'abs':
            fieldNumeric = field.getTime();
            matchNumeric = new Date(match).getTime();
            break;
        case 'dow':
            fieldNumeric = field.getDay() + 1; // our values use 1 based indexes
            matchNumeric = parseFloat(match);
            break;
        case 'dom':
        default:
            fieldNumeric = field.getDate();
            matchNumeric = parseFloat(match);
            break;
    }

    return checkNumberField(fieldNumeric, matchNumeric, op);
};

const checkNumberField = (field, match, op) => {
    let matches = false;
    const fieldNumeric = Math.abs(field);
    const matchNumeric = parseFloat(match);

    switch (op) {
        case Rule.operations.eq:
            matches = fieldNumeric === matchNumeric;
            break;
        case Rule.operations.gt:
            matches = fieldNumeric > matchNumeric;
            break;
        case Rule.operations.lt:
            matches = fieldNumeric < matchNumeric;
            break;
        case Rule.operations.gte:
            matches = fieldNumeric >= matchNumeric;
            break;
        case Rule.operations.lte:
            matches = fieldNumeric <= matchNumeric;
            break;
        default:
            throw new Error(`Unexpected operation ${op}`);
    }

    return matches;
};

/**
 * @type {_Infrastructure._Rules.RulesEngine}
 */
module.exports = RulesEngine;
