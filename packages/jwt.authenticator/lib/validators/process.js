'use strict';

const { ErrorSpecs } = require('internal-handler');
const { StatusCodeError } = require('internal-status-code-error');

module.exports = ({ env }) => {
    if (!env.Environment) {
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent], ErrorSpecs.invalidEvent.statusCode);
    }
};
