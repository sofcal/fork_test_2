'use strict';

// project

// internal modules

// external modules
const Promise = require('bluebird');

class BlobStorage {
    constructor({ s3 }) {
        this.s3 = s3;
    }

    storeResults(...args) {
        return storeResultsImpl(this, ...args);
    }
    getResults(...args) {
        return getResultsImpl(this, ...args);
    }
}

const storeResultsImpl = Promise.method((self, { results }) => {
    return services.s3.get(key)
        .then((result) => ({ key, result }));
});

module.exports = BlobStorage;
