'use strict';

const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-statuscodeerror');

const _ = require('underscore');

const consts = { InvalidType: 'InvalidType' };

/**
 * Validates that an object is of a specified type. Type MUST be provided, otherwise an unwrapped error will be thrown
 * @param obj: the object to be validated
 * @param Type: the Type the object should be
 * @param noThrow: a boolean flag to say whether the function should throw, or return it's errors
 * @returns {*}
 */
module.exports = ({ obj, Type, noThrow = false } = {}) => {
    const isValid = obj && Type && (obj instanceof Type) && !_.isFunction(obj) && !_.isArray(obj);
    if (isValid) {
        return undefined;
    }

    const item = StatusCodeErrorItem.Create(consts.InvalidType, `Expected object of type: ${Type ? Type.name : 'Unknown'}`);
    if (noThrow) {
        return item;
    }
    throw StatusCodeError.Create([item], 400);
};
