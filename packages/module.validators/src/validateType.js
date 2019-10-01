const { services: { common: { InvalidProperties, InvalidPropertiesFormat, InvalidType } } } = require('@sage/bc-common-resources');
const { StatusCodeErrorItem } = require('@sage/bc-common-statuscodeerror');
const _ = require('underscore');
const { format } = require('util');

const validateType = {
    validateTypeNoThrow(obj, Type, property) {
        if (!obj || !(obj instanceof Type) || _.isFunction(obj) || _.isArray(obj)) {
            if (!property) {
                return new StatusCodeErrorItem(InvalidType, `Expected object of type: ${Type.name}`);
            }

            const message = format(InvalidPropertiesFormat, property.prefix, property.path, obj);
            const params = {};
            params[property.path] = obj;
            return new StatusCodeErrorItem(InvalidProperties, message, params);
        }
        return undefined;
    },
};

module.exports = validateType;
