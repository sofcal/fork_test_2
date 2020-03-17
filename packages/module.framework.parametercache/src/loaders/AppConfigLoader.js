'use strict';

const Promise = require('bluebird');

class AppConfigLoader {
    constructor({ envPrefix = null, env = null }) {
        console.log('>>>> [AppConfigLoader] created');
        this.envPrefix = envPrefix;
        this.env = env;
    }

    load(params) {
        console.log('>>>> [AppConfigLoader] load() called');
        return loadImpl(this, params);
    }
}

const loadImpl = Promise.method((self, params) => {});

module.exports = AppConfigLoader;
