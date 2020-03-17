'use strict';

const Promise = require('bluebird');

class LazyCache {
    constructor({ key, refreshFunction, ttl = LazyCache.ImmediateRefresh }) {
        this.key = key;
        this.refreshFunction = refreshFunction;
        this.ttl = ttl;
        this.lastRefresh = 0;
        this.currentRefresh = null;
        this.results = null;

        validate(this);
    }

    getResults() {
        return getResultsImpl(this);
    }
}
LazyCache.NoRefresh = -1;
LazyCache.ImmediateRefresh = 0;

const validate = (self) => {
    if (!self.refreshFunction || typeof self.refreshFunction !== 'function') {
        throw new Error('invalid refresh function');
    }
};

const getResultsImpl = Promise.method((self) => {
    if (self.results === null) {
        if (!self.currentRefresh) {
            self.currentRefresh = refresh(self);
        }

        return self.currentRefresh;
    }

    if (self.ttl !== LazyCache.NoRefresh && (self.lastRefresh < Date.now() - self.ttl) && !self.currentRefresh){
        self.currentRefresh = refresh(self);
    }

    return self.results;
});

const refresh = Promise.method((self) => {
    return self.refreshFunction()
        .then((results) => {
            self.results = results;
            self.lastRefresh = Date.now();
            self.currentRefresh = null;

            return results;
        });
});

module.exports = LazyCache;
