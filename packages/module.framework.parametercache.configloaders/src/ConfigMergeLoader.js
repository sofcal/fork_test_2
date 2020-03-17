'use strict';

const Promise = require('bluebird');
const merge = require('./util/merge');

class FileMergeLoader {
    constructor({ configPropertyName = '__config', overridesPropertyName = '__overrides' }) {
        this.configPropertyName = configPropertyName;
        this.overridesPropertyName = overridesPropertyName;
    }

    load(params) {
        return loadImpl(this, params);
    }
}

const loadImpl = Promise.method((self, params) => {
    const { configPropertyName, overridesPropertyName } = self;

    const invalidProperty = !configPropertyName || !overridesPropertyName;
    const invalidParams = !params[configPropertyName];

    if (invalidProperty) {
        const configPropertyMessage = !configPropertyName ? `configPropertyName: ${configPropertyName}; ` : '';
        const overridesPropertyMessage = !overridesPropertyName ? `overridesPropertyName: ${overridesPropertyName}` : '';

        throw new Error(`[ConfigMergeLoader] invalid property - ${configPropertyMessage}${overridesPropertyMessage}`);
    } else if (invalidParams) {
        const configParamsMessage = !params[configPropertyName] ? `params[${configPropertyName}]: ${params[configPropertyName]}; ` : '';

        throw new Error(`[ConfigMergeLoader] invalid params - ${configParamsMessage}`);
    }

    if (!params[overridesPropertyName]) {
        console.log('[ConfigMergeLoader] nothing to merge'); // eslint-disable-line no-console
        return;
    }

    const config = params[configPropertyName];
    const overrides = JSON.parse(params[overridesPropertyName]);

    params[configPropertyName] = merge(config, overrides); // eslint-disable-line no-param-reassign
});

module.exports = FileMergeLoader;