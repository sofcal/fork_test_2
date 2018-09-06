'use strict';

const jsonschema = require('jsonschema');
const ruleBucketSchema = require('./schemas/ruleBucketSchema');
const Rule = require('./Rule');
const { StatusCodeError, StatusCodeErrorItem, utils } = require('./_bankDrive');
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
    const typeItem = utils.validateTypeNoThrow(ruleBucket, RuleBucket);
    if (typeItem) {
        throw new StatusCodeError([typeItem], 400);
    }

    const result = jsonschema.validate(ruleBucket, ruleBucketSchema);

    if (result.errors.length > 0) {
        if (noThrow) {
            return createErrorItems(result.errors, ruleBucket);
        }
        const error = createError(result.errors, ruleBucket);
        throw error;
    }
    return true;
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
            invalidValue[dotSeparated] = prop[0];
        } else {
            invalidValue[dotSeparated] = prop;
        }
        const errorText = `Rule.${dotSeparated}: ${invalidValue[dotSeparated]}`;
        errorItems.push(new StatusCodeErrorItem('InvalidProperties', errorText, invalidValue));
    });
    return errorItems;
};

const resolvePath = (path, obj = self, separator = '.') => {
    let properties = Array.isArray(path) ? path : path.split(separator);
    return properties.reduce((prev, curr) => prev && prev[curr], obj);
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

// replace or insert rule into rules array based on its rank and recalculate rank for all rules
const addOrUpdateRuleByRankImpl = (existingRules, rule) => {
    let newRules = _.reject(existingRules, (existing) => existing.uuid === rule.uuid);

    // remove this rule from the array if it exists
    const newIndex = (rule.ruleRank > 0) ? rule.ruleRank - 1 : newRules.length;

    // insert rule into array based on it's rank
    newRules.splice(newIndex, 0, rule);
    const reorderedRules = [];
    reorderedRules.push(...orderTypedRules(newRules, Rule.ruleTypes.user));
    reorderedRules.push(...orderTypedRules(newRules, Rule.ruleTypes.accountant));
    reorderedRules.push(...orderTypedRules(newRules, Rule.ruleTypes.feedback));
    reorderedRules.push(...orderTypedRules(newRules, Rule.ruleTypes.global));    
    RuleBucket.resetRuleRanks(reorderedRules);

    return reorderedRules;
};

const orderTypedRules = (rules, filter) => {
    const typesRule = _.filter(rules, (r) => r.ruleType === filter);
    RuleBucket.resetRuleRanks(typesRule);
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

