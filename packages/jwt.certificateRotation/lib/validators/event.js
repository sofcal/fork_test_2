'use strict';

const { ErrorSpecs } = require('internal-handler');
const { StatusCodeError } = require('internal-status-code-error');

module.exports = () => {
    const valid = true;

    if (!valid) {
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent], ErrorSpecs.invalidEvent.statusCode);
    }
};
