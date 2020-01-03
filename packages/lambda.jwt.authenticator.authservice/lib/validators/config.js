'use strict';

const { ErrorSpecs } = require('@sage/bc-independent-lambda-handler');
const { StatusCodeError } = require('@sage/bc-common-statuscodeerror');

module.exports = (config, { logger }) => {
    if (!config || !config.cacheExpiry || !config.serviceMappings) {
        logger.error({ function: 'validate.config', msg: 'invalid config', params: { config } });
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidConfig], ErrorSpecs.invalidConfig.statusCode);
    }
};
