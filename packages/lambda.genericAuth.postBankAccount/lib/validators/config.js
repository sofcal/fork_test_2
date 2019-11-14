'use strict';

const { ErrorSpecs } = require('@sage/bc-independent-lambda-handler');

module.exports = (config, { logger }) => {
    console.log(`AG Test: Into Config Validator - config: ${config}`);
    if (!config) {
        logger.error({ function: 'validate.config', msg: 'invalid config', params: { config } });
        throw Error('invalid config');
    }
};
