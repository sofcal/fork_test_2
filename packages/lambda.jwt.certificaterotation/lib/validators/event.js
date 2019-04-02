'use strict';

const { ErrorSpecs } = require('@sage/bc-default-lambda-handler');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');

module.exports = () => {
    const valid = true;

    if (!valid) {
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent], ErrorSpecs.invalidEvent.statusCode);
    }
};
