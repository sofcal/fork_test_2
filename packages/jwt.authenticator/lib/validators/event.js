'use strict';

const ErrorSpecs = require('../ErrorSpecs');
const { StatusCodeError } = require('internal-status-code-error');

module.exports = (event) => {
    if (!event.authToken) {
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.authTokenNotFound], ErrorSpecs.authTokenNotFound.statusCode);
    }
};
