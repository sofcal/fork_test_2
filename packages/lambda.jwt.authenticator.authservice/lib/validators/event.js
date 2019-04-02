'use strict';

const ErrorSpecs = require('../ErrorSpecs');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');

module.exports = (event) => {
    if (!event.authorizationToken && !(event.headers && event.headers.Authorization)) {
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.authTokenNotFound], ErrorSpecs.authTokenNotFound.statusCode);
    }
};
