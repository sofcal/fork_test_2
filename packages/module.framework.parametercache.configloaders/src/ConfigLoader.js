'use strict';

const Promise = require('bluebird');
const _ = require('underscore');

class ConfigLoader {
    constructor({ path, configPropertyName = '__config' }) {
        this.path = path;
        this.configPropertyName = configPropertyName;
    }

    load(params) {
        return loadImpl(this, params);
    }
}

const loadImpl = Promise.method((self, params) => {
    const { configPropertyName, path } = self;

    const invalidProperty = !path || !configPropertyName;

    if (invalidProperty) {
        const pathMessage = !path ? `path: ${path}; ` : '';
        const configPropertyMessage = !configPropertyName ? `configPropertyName: ${configPropertyName}` : '';

        throw new Error(`[ConfigLoader] invalid property - ${pathMessage}${configPropertyMessage}`);
    }

    const gen = require(path); // eslint-disable-line import/no-dynamic-require, global-require
    params[configPropertyName] = _.isFunction(gen) ? gen(params) : gen; // eslint-disable-line no-param-reassign
});

module.exports = ConfigLoader;
