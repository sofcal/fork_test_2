'use strict';

const ErrorSpecs = require('../ErrorSpecs');
const { StatusCodeError } = require('@sage/bc-common-statuscodeerror');

module.exports = (event) => {
    // nothing to validate on the event
    const validEvent = true;

    if (!validEvent) {
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent], ErrorSpecs.invalidEvent.statusCode);
    }

    return event;
};
