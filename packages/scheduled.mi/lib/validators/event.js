'use strict';

const ErrorSpecs = require('../ErrorSpecs');
const { StatusCodeError } = require('internal-status-code-error');

module.exports = (event) => {
    const valid = true;

    if (!valid) {
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent], ErrorSpecs.invalidEvent.statusCode);
    }
};