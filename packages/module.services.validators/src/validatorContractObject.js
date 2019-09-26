'use strict';

const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-statuscodeerror');
const { services: { common: { InvalidProperties, InvalidPropertiesFormat } } } = require('@sage/bc-common-resources');
const validateType = require('./validateType');
const _ = require('underscore');
const { format } = require('util');
const access = require('safe-access');

// const { validateTypeNoThrow } = validateType;

const validateContract = {
    validateContractObjectNoThrow(obj, Type, properties, parent) {
        const prefix = Type.name;

        let items = [];
        let abandoned = false;

        // loop through properties
        _.each(properties, (property) => {
            if (abandoned) {
                return undefined;
            }

            let values = access(obj, property.path);
            const isArray = _.isArray(values);
            const isEmptyArray = isArray && !values.length;

            if (property.allowEmptyArray && isEmptyArray) {
                return undefined;
            }

            if (property.arrayCustom && isArray && values.length) {
                return items.push.apply(items, property.arrayCustom(values)); // eslint-disable-line prefer-spread
            }

            const invalidArrayEmpty = isArray && !property.optional && !values.length;
            const invalidCustomArray = !isArray && property.arrayCustom;

            if (invalidArrayEmpty || invalidCustomArray) {
                const params = {};
                params[property.path] = values;
                const message = format(InvalidPropertiesFormat, prefix, property.path, isArray ? 'invalid collection' : 'should be an array');
                return items.push(new StatusCodeErrorItem(InvalidProperties, message, params));
            }

            values = isArray ? values : [values];

            // now loop through values
            _.each(values, (value) => {
                let { optional } = property;
                if (property.conditional && _.isFunction(property.conditional)) {
                    // bitwise OR assignment
                    optional |= !property.conditional(); // eslint-disable-line no-bitwise
                }

                if ((!optional) || (optional && !(_.isUndefined(value) || (property.allowNull && _.isNull(value))))) {
                    const failValue = _.isUndefined(value) || _.isNull(value);
                    const failRegex = !failValue && property.regex && (!_.isString(value) || !property.regex.test(value));
                    const failCustom = !failValue && property.custom && !property.custom(value);

                    if (failValue || failRegex || failCustom) {
                        const message = format(InvalidPropertiesFormat, prefix, property.path, value);
                        const params = {};
                        params[property.path] = value;
                        items.push(new StatusCodeErrorItem(InvalidProperties, message, params));

                        if (property.abandon) {
                            abandoned = true;
                        }
                    } else if (!failValue && property.nested) {
                        const i = property.nested(value);
                        items.push.apply(items, i); // eslint-disable-line prefer-spread
                    }
                }
            });

            return undefined;
        });

        if (items.length && parent) {
            const message = format(InvalidPropertiesFormat, prefix, parent, obj);
            const params = {};
            params[parent] = obj;
            items = [new StatusCodeErrorItem(InvalidProperties, message, params)];
        }

        return items;
    },

    validateContractObject(obj, Type, properties) {
        const typeItem = validateType.validateTypeNoThrow(obj, Type);

        if (typeItem) {
            throw new StatusCodeError([typeItem], 400);
        }

        const items = validateContract.validateContractObjectNoThrow(obj, Type, properties);

        if (items.length) {
            throw new StatusCodeError(items, 400);
        }
    }
};

module.exports = validateContract;
