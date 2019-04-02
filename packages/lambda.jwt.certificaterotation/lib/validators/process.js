'use strict';

const { ErrorSpecs } = require('@sage/bc-default-lambda-handler');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');

module.exports = ({ env }) => {
    if (!env.Environment) {
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent], ErrorSpecs.invalidEvent.statusCode);
    }
};
