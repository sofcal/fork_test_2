'use strict';

const ErrorSpecs = require('../ErrorSpecs');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');

module.exports = (event, { logger }) => {
    const parsed = event.body ? JSON.parse(event.body) : event;
    
    if (!parsed.bucket) {
        logger.error({ function: 'validate.event', msg: 'invalid event: missing bucket', params: { parsed } });
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent.bucket], ErrorSpecs.invalidEvent.bucket.statusCode);
    }

    if (!parsed.key) {
        logger.error({ function: 'validate.event', msg: 'invalid event: missing key', params: { parsed } });
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent.key], ErrorSpecs.invalidEvent.key.statusCode);
    }

    if (!parsed.destination) {
        logger.error({ function: 'validate.event', msg: 'invalid event: missing destination', params: { parsed } });
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent.destination], ErrorSpecs.invalidEvent.destination.statusCode);
    }

    return event.body ? JSON.parse(event.body) : event;
};
