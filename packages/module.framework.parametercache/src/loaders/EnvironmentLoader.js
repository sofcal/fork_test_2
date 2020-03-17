'use strict';

const Promise = require('bluebird');

class EnvironmentLoader {
    constructor({envPrefix=null, env=null}){
        this.envPrefix = envPrefix;
        this.env = env;
    }

    load(params) {
        return loadImpl(this, params);
    }
}

const loadImpl = Promise.method((self, params) => {
    const prefix = self.envPrefix;
    const env = self.env;

    if(!env) {
        throw new Error('[EnvironmentLoader] environment object missing');
    }

    Object.keys(env).forEach((key) => {
        if(!prefix || key.indexOf(prefix) === 0) {
            const name = key.substring(prefix ? prefix.length : 0);
            params[name] = env[key];
        }
    });
});

module.exports = EnvironmentLoader;