'use strict';

const { ErrorSpecs } = require('@sage/bc-independent-lambda-handler');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');

module.exports = (config, { logger }) => {
    // TODO: are we getting these values from process or param-store?
    if (!config || !config.cacheExpiry || !config.serviceMappings) {
        logger.error({ function: 'validate.config', msg: 'invalid config', params: { config } });
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEnvironment], ErrorSpecs.invalidEnvironment.statusCode);
    }
};
