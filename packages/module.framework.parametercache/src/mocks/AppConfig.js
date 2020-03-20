'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));

class AppConfig {
    constructor({ path }) {
        this.path = path;
        this.parsed = null;
    }

    getConfigurationAsync(...args) {
        return getConfigurationAsyncImpl(this, ...args);
    }
}

const getConfigurationAsyncImpl = Promise.method((self) => {
    if (self.parsed) {
        return self.parsed;
    }

    return fs.readFileAsync(self.path, 'utf-8')
        .then((file) => (self.parsed = JSON.parse(file))); // eslint-disable-line
});

module.exports = AppConfig;
