'use strict';

const ErrorSpecs = require('../ErrorSpecs');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');

module.exports = (event, { logger }) => {

    if (!event) {
        logger.error({ function: 'validate.event', msg: 'invalid event: missing event', params: { event } });
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent.event], ErrorSpecs.invalidEvent.event.statusCode);
    }

    const parsed = event.body ? JSON.parse(event.body) : event;
    
    if (!parsed.bucket) {
        logger.error({ function: 'validate.event', msg: 'invalid event: missing bucket', params: { parsed } });
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent.bucket], ErrorSpecs.invalidEvent.bucket.statusCode);
    }

    if (!parsed.key) {
        logger.error({ function: 'validate.event', msg: 'invalid event: missing key', params: { parsed } });
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent.key], ErrorSpecs.invalidEvent.key.statusCode);
    }

    if (!parsed.bank) {
        logger.error({ function: 'validate.event', msg: 'invalid event: missing bank', params: { parsed } });
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent.bank], ErrorSpecs.invalidEvent.bank.statusCode);
    }

    return event.body ? JSON.parse(event.body) : event;
};
