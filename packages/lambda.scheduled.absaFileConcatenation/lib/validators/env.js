'use strict';

const ErrorSpecs = require('../ErrorSpecs');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');
const _ = require('underscore');

module.exports = (env) => {
    const { bucket, fromPrefix, toPrefix } = env;
    const validEnv = bucket && _.isString(bucket) && fromPrefix && _.isString(fromPrefix) && toPrefix && _.isString(toPrefix);

    if (!validEnv) {
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent], ErrorSpecs.invalidEvent.statusCode);
    }

    return env;
};
