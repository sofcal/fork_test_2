'use strict';

const { ErrorSpecs } = require('../ErrorSpecs');
const { StatusCodeError } = require('@sage/bc-status-code-error');

module.exports = (config, { logger }) => {
    if (!config || !config.cacheExpiry || !config.serviceMappings) {
        logger.error({ function: 'validate.config', msg: 'invalid config', params: { config } });
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidConfig], ErrorSpecs.invalidConfig.statusCode);
    }
};
