'use strict';

const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-statuscodeerror');
const access = require('safe-access');
const _ = require('underscore');
const _s = require('underscore.string');

// currently, this conversion mimics the behaviour of Banking Cloud validation. We are looking to update the validation
//  messages seen by consuming client applications, but until we do that we need to preserve the responses they saw previously
const toStatusCodeErrorItems = (result) => {
    return _.map(result.errors, (err) => {
        if (err.custom) {
            return StatusCodeErrorItem.Create('InvalidProperties', err.message, err.params);
        }

        const propertyNames = getPropertyNames(err);
        const { withType, withoutType, parents, isArray, isNested } = propertyNames;

        const isSimpleType = result.schema.type !== 'object' && result.schema.type !== 'array';
        const custom = getCustomField({ schema: result.schema, withoutType, parent: _.last(parents), isSimpleType, isArray, isNested });

        const parentIndex = custom.useParent ? custom.useParent - 1 : parents.length - 1;
        const parent = parents[parentIndex] || {};
        const { parentWithType, parentWithoutType, parentWithoutTypePrefix } = parent; // custom.useParent ? parents[custom.useParent - 1] : (parents[0] || {});
        const required = err.name === 'required';

        console.log('_____PROPERTY_NAMES');
        console.log(propertyNames);
        console.log(custom);
        console.log(parent);

        // the actual value for the field causing the error changes depending on whether it's a required field error, an array, or neither...
        let valueActual;
        if (isSimpleType) {
            // simple types and arrays we can use the instance value without issue...
            valueActual = err.instance;
        } else if (custom.useParent) {
            // ...but if the custom overrides want to, we have to use the parent field instead...
            valueActual = parentWithoutType ? access(result, `instance.${parentWithoutType}`) : result.instance;
        } else {
            // ... and otherwise we take it off the instance object. We could do this for arrays too, but the above is just simpler
            valueActual = access(result, `instance.${withoutType}`);
        }
        // ...once we have the valueActual, the value we use is that or the custom override
        const value = custom.value || valueActual;

        // property name is the full Type qualified property, or the custom override
        const propertyName = custom.propertyName || (custom.useParent ? parentWithType : withType);

        // paramKey changes depending on whether the field is required, and whether it's a simple type (string, integer, etc):
        //  - for field required errors, we need to include the argument field, so that nested objects print correctly
        //  - for simple types we set the paramKey as just value
        // once we have this, the paramKey becomes the value we calculated, or the custom override
        const paramKeyBasic = required ? `${parentWithoutTypePrefix}${err.argument}` : withoutType;
        const paramKeyActual = isSimpleType ? 'value' : paramKeyBasic;
        const paramKey = custom.paramKey || paramKeyActual;

        // message defaults to the valueActual, or a custom override...
        let message = custom.message || valueActual;
        // ... and we stringify it if required
        message = !_.isString(message) && custom.stringify ? JSON.stringify(message) : message;

        const params = {};
        params[paramKey] = value;

        return StatusCodeErrorItem.Create('InvalidProperties', `${propertyName}: ${message}`, params);
    });
};

const getPropertyNames = (err) => {
    const required = err.name === 'required';

    const withTypeAndArray = `${err.property}${required ? `.${err.argument}` : ''}`;
    const type = _s.strLeft(withTypeAndArray, '.');

    let isArray = _s.endsWith(withTypeAndArray, ']');
    const withType = withTypeAndArray;// isArray ? _s.strLeftBack(withTypeAndArray, '[') : withTypeAndArray;
    const withoutType = _s.strRight(withType, '.');
    const isNested = withoutType.indexOf('.') !== -1;

    const parents = [];
    let current = withType;
    let splitIndex = withTypeAndArray.split('.').length;
    while (splitIndex > 1) {
        splitIndex -= 1;
        console.log('_____CURRENT: TYPE', `${current}:${type}`);
        const parentWithTypeAndArray = _s.strLeftBack(current, '.');
        const isParentArray = _s.endsWith(parentWithTypeAndArray, ']');
        const parentWithType = parentWithTypeAndArray;
        const parentWithoutType = isNested ? _s.strRight(parentWithType, '.') : undefined;
        const parentWithoutTypePrefix = parentWithoutType ? `${parentWithoutType}.` : '';

        isArray = isArray || isParentArray;

        parents.unshift({ parentWithType, parentWithoutType, parentWithoutTypePrefix });
        current = parentWithType;
    }

    return { withType, withoutType, parents, isArray, isNested };
};

const getCustomField = ({ schema, withoutType, parent = {}, isSimpleType, isArray, isNested }) => {
    if (isSimpleType) {
        return schema.custom || {};
    }

    const elementName = _s.strLeft((parent.parentWithoutType || withoutType), '[');
    const element = access(schema, `properties.${elementName}`);

    if (!element) {
        return {};
    }

    const custom = element.custom || {};
    switch (element.type) {
        case 'array': return (isArray && access(element, 'custom.items')) || custom;
        case 'object': return (isNested && access(element, 'custom.item')) || custom;
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
