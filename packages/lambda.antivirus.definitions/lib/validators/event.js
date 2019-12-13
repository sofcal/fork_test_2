'use strict';

const ErrorSpecs = require('../ErrorSpecs');
const { StatusCodeError } = require('@sage/bc-common-statuscodeerror');

module.exports = (event) => {
    const valid = true;

    if (!valid) {
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent], ErrorSpecs.invalidEvent.statusCode);
    }
};
