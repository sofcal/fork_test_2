'use strict';

const { ErrorSpecs } = require('@sage/bc-independent-lambda-handler');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');

module.exports = (config, { logger }) => {
    if (!config) {
        logger.error({ function: 'validate.config', msg: 'invalid config', params: { config } });
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidConfig], ErrorSpecs.invalidConfig.statusCode);
    }

    if (!config.OutputBucket) {
        logger.error({ function: 'validate.config', msg: 'invalid config - no OutputBucket specificed', params: { config } });
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidConfig], ErrorSpecs.invalidConfig.statusCode);
    }

};
