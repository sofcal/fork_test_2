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

module.exports = RuleBucket;

