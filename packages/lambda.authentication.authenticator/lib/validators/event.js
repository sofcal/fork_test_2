'use strict';

const ErrorSpecs = require('../ErrorSpecs');
const { StatusCodeError } = require('@sage/bc-status-code-error');

module.exports = (event) => {
    if (!event.authorizationToken) {
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.authTokenNotFound], ErrorSpecs.authTokenNotFound.statusCode);
    }
};
