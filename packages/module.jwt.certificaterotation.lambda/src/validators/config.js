'use strict';

const ErrorSpecs = require('../ErrorSpecs');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');

module.exports = (config, { logger }) => {
    if (!config) {
        logger.error({ function: 'validate.config', msg: 'invalid config', params: { config } });
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidConfig], ErrorSpecs.invalidConfig.statusCode);
    }
};