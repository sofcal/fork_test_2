'use strict'

const httpMethod = require('./httpMethod');
const StatusCodeErrorItem = require('./StatusCodeErrorItem');
const resources = require('./resources');
const _ = require('underscore');

class utils {

    static extend(...args) {
        return extendImpl(...args);
    }

    static validateTypeNoThrow(...args) {
        return validateTypeNoThrowImpl(...args);
    }

}

const extendImpl = (destination, source, method, keys, readOnlyKeys) => {

    // first, we need to filter any value from the source object that doesn't belong on this Type. The allowable values
    //  are different if we're updating an existing object, than if we're creating a new one
    source = _.pick(source, keys);

    // if we're only interested in keeping the readonly fields, we need to strip all other fields from the destination object.
    // That way if they're not provided on the source, the object won't validate.
    if (method === httpMethod.put) {
        destination = _.pick(destination, readOnlyKeys);
    }

    return _.extendOwn({}, destination, source);
};

const validateTypeNoThrowImpl = (obj, Type, property) => {
    if (!obj || !(obj instanceof Type) || _.isFunction(obj) || _.isArray(obj)) {
        if (!property)
            return new StatusCodeErrorItem(resources.services.common.InvalidType, 'Expected object of type: ' + Type.name);

        var message = format(resources.services.common.InvalidPropertiesFormat, property.prefix, property.path, obj);
        var params = {};
        params[property.path] = obj;
        return new StatusCodeErrorItem(resources.services.common.InvalidProperties, message, params);
    }
};

module.exports = utils;





