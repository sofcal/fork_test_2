'use strict';

const { ErrorSpecs } = require('@sage/bc-independent-lambda-handler');

module.exports = (config, { logger }) => {
    if (!config) {
        logger.error({ function: 'validate.config', msg: 'invalid config', params: { config } });
        throw Error('Invalid Config');
    }
};
