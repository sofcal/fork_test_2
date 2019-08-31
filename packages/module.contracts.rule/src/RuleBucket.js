'use strict';

const Rule = require('./Rule');
const ruleBucketSchema = require('./schemas/ruleBucketSchema');

const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-statuscodeerror');
const { Mapper: StatusCodeErrorMapper } = require('@sage/bc-jsonschema-to-statuscodeerror');
const { validateType } = require('@sage/bc-contracts-util');

const jsonschema = require('jsonschema');
const _ = require('underscore');

class RuleBucket {
    constructor(data) {
        if (data) {
            this.uuid = data.uuid;

            this.region = data.region;
            this.organisationId = data.organisationId;
            this.bankAccountId = data.bankAccountId;
            this.numberOfRules = data.numberOfRules;
            this.rules = _.map(data.rules || [], (r) => (new Rule(r)));
            this.isAccountOwnerRules = data.isAccountOwnerRules || false;
            this.productId = data.productId || null;
        }
    }

    static Create(...args) {
        return new RuleBucket(...args);
    }

    validate(noThrow = false) {
        return RuleBucket.validate(this, noThrow);
    }

    static validate(...args) {
        return validateImpl(...args);
    }

    static MaxBucketSize() { return 300; }

    static addOrUpdateRuleByRank(...args) {
        return addOrUpdateRuleByRankImpl(...args);
    }

    static resetRuleRanks(...args) {
        return resetRuleRanksImpl(...args);
    }

    static checkForDuplicateRuleNames(...args) {
        return checkForDuplicateRuleNamesImpl(...args);
    }
}

const validateImpl = function(ruleBucket, noThrow) {
    const typeItem = validateType({ obj: ruleBucket, Type: RuleBucket, noThrow });
    if (typeItem) {
        // can only get here if noThrow was true
        return ([typeItem]);
    }

    const result = jsonschema.validate(ruleBucket, ruleBucketSchema, { propertyName: RuleBucket.name });

    if (result.errors.length > 0) {
        if (noThrow) {
            return StatusCodeErrorMapper.toStatusCodeErrorItems(result);
        }

        throw StatusCodeErrorMapper.toStatusCodeError(result);
    }

    return noThrow ? [] : undefined;
};

const createError = (errCollection, rule) => {
    return new StatusCodeError(createErrorItems(errCollection, rule), 400);
};

const createErrorItems = (errCollection, rule) => {
    const errorItems = [];
    _.each(errCollection, (err) => {
        const invalidValue = {};
        const dotSeparated = buildDotSeparatedString(err.property);
        const prop = resolvePath(dotSeparated, rule);
        if (_.isArray(prop)) {
            invalidValue[dotSeparated] = prop[0]; // eslint-disable-line prefer-destructuring
        } else {
            invalidValue[dotSeparated] = prop;
        }
        const errorText = `Rule.${dotSeparated}: ${invalidValue[dotSeparated]}`;
        errorItems.push(new StatusCodeErrorItem('InvalidProperties', errorText, invalidValue));
    });
    return errorItems;
};

const resolvePath = (path, obj, separator = '.') => {
    const properties = Array.isArray(path) ? path : path.split(separator);
    return properties.reduce((prev, curr) => prev && prev[curr], obj);
};

const buildDotSeparatedString = (dotSeparated) => {
    let ret = dotSeparated.split('instance.').join('');
    ret = ret.split('[').join('.');
    ret = ret.split(']').join('');
    if (ret.indexOf('.') > 0) {
        ret = ret.substring(0, ret.indexOf('.'));
    }
    return ret;
};

// replace or insert rule into rules array based on its rank and recalculate rank for all rules
const addOrUpdateRuleByRankImpl = (existingRules, rule) => {
    const newRules = _.reject(existingRules, (existing) => existing.uuid === rule.uuid);

    // remove this rule from the array if it exists
    const newIndex = (rule.ruleRank > 0) ? rule.ruleRank - 1 : newRules.length;

    // insert rule into array based on it's rank
    newRules.splice(newIndex, 0, rule);
    const reorderedRules = [];
    // TODO: surely this can be optimised? 4 loops where 1 will work
    reorderedRules.push(...orderTypedRules(newRules, Rule.ruleTypes.user));
    reorderedRules.push(...orderTypedRules(newRules, Rule.ruleTypes.accountant));
    reorderedRules.push(...orderTypedRules(newRules, Rule.ruleTypes.feedback));
    reorderedRules.push(...orderTypedRules(newRules, Rule.ruleTypes.global));
    // TODO: can we avoid resetting rule ranks in the orderTypedRules calls, by just doing it here once
    RuleBucket.resetRuleRanks(reorderedRules);

    return reorderedRules;
};

const orderTypedRules = (rules, filter) => {
    const typesRule = _.filter(rules, (r) => r.ruleType === filter);
    // TODO: one additional loop per ruleType
    RuleBucket.resetRuleRanks(typesRule);
    // TODO: why do we need to do both these things? Surely if we just reset the ranks, they're already ordered
    return Rule.sortRulesByRank(typesRule);
};

// reset all rank values to match position in the array
const resetRuleRanksImpl = (rules) => {
    _.each(rules, (rule, index) => {
        // eslint-disable-next-line no-param-reassign
        rule.ruleRank = index + 1;
    });
};

const checkForDuplicateRuleNamesImpl = (bucket, doNotThrow) => {
    let duplicatesPresent = false;
    const duplicates = [];

    _.chain(bucket.rules)
        .pluck('ruleName')
        // TODO: use find instead of each, so we can short-circuit
        .each((rn) => {
            if (_.contains(duplicates, rn)) {
                if (!doNotThrow) {
                    throw new StatusCodeError([new StatusCodeErrorItem('AlreadyExists', `A rule with the given name already exists: ${rn}`)], 409);
                }
                duplicatesPresent = true;
            }
            duplicates.push(rn);
        });
    return duplicatesPresent;
};

module.exports = RuleBucket;

