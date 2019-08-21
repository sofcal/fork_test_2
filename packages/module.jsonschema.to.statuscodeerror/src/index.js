'use strict';

const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-statuscodeerror');
const access = require('safe-access');
const _ = require('underscore');
const _s = require('underscore.string');

// currently, this conversion mimics the behaviour of Banking Cloud validation. We are looking to update the validation
//  messages seen by consuming client applications, but until we do that we need to preserve the responses they saw previously
const toStatusCodeErrorItems = (result, Type, obj) => {
    return _.map(result.errors, (err) => {
        if (err.custom) {
            return StatusCodeErrorItem.Create('InvalidProperties', err.message, err.params);
        }
        const required = err.name === 'required';
        const fullPropertyName = required ? `${err.property}.${err.argument}` : err.property;
        const property = fullPropertyName.replace(`${Type.name}.`, '');
        const parentProperty = _s.strLeftBack(property, '.');

        const custom = getCustomField(result.schema, property);

        const splits = _s.words(property, '.');
        const treatAsArray = _.find(_.last(splits, 2), (split) => _s.endsWith(split, ']'));

        const trimmedProperty = custom.property || _s.strLeft(err.property, '[');
        const trimmedValueKey = treatAsArray ? (`${_s.strLeft(custom.useParent ? parentProperty : property, ']')}]`) : custom.useParent ? parentProperty : property;
        const trimmedParamKey = custom.paramKey || (required ? err.argument : _s.strLeft(property, '['));

        const value = access(obj, trimmedValueKey);
        let message = custom.message || value;
        message = !_.isString(message) && custom.stringify ? JSON.stringify(message) : message;

        const params = {};
        params[trimmedParamKey] = custom.value || value;
        return StatusCodeErrorItem.Create('InvalidProperties', `${trimmedProperty}: ${message}`, params);
    });
};

const getCustomField = (schema, property) => {
    const isProperty = property.indexOf('.') !== -1;
    let parent = _s.strLeft(property, '.');
    const isArray = parent.indexOf('[') !== -1;
    parent = _s.strLeft(parent, '[');
    const element = access(schema, `properties.${parent}`);

    if (!element) {
        return {};
    }

    const custom = element.custom || {};
    switch (element.type) {
        case 'array': return isArray ? (access(element, 'custom.items') || custom) : custom;
        case 'object': return isProperty ? access(element, 'custom.item') || custom : custom;
        default: return custom;
    }
};

const toStatusCodeError = (result, Type, obj) => {
    if (!result.errors || !result.errors.length) {
        return null;
    }

    return StatusCodeError.Create(toStatusCodeErrorItems(result, Type, obj), 400);
};

module.exports = { toStatusCodeErrorItems, toStatusCodeError };
