'use strict';

const ErrorSpecs = require('../ErrorSpecs');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');

module.exports = (event, { logger }) => {
    const parsed = event.body ? JSON.parse(event.body) : event;
    
    // if (!parsed.numTrxToCreate) {
    //     logger.error({ function: 'validate.event', msg: 'invalid event: missing numTrxToCreate', params: { parsed } });
    //     throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent.missingNumTrxToCreate], ErrorSpecs.invalidEvent.missingNumTrxToCreate.statusCode);
    // }

    return event.body ? JSON.parse(event.body) : event;
};
