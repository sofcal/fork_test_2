'use strict';

const Promise = require('bluebird');

const LazyCacheFactory = require('./lazyCache/LazyCacheFactory');

class ParameterCache {
    constructor() {
        this.loaders = [];
        this.lazyCache = null;
        this.config = {};
    }

    init(options={}, loaders=[]) {
        this.lazyCache = LazyCacheFactory.create({
            key: 'lambda-parameters',
            refreshFunction: this.refresh.bind(this),
            ttl: options.cacheTTL || -1
        });

        for(let i=0; i<loaders.length; ++i){
            if(!(loaders[i].load)) {
                throw new Error('invalid loader');
            }
        }

        this.loaders = loaders;
    }

    load() {
        return loadImpl(this);
    }

    refresh() {
        return refreshImpl(this);
    }
}

const loadImpl = Promise.method((self) => {
    return self.lazyCache.getResults()
        .then((config) => (self.config = config));
});

const refreshImpl = Promise.method((self) => {
    const params = {};
    return Promise.each(self.loaders, (loader) => loader.load(params))
        .then(() => params);
});

module.exports = { ParameterCache, instance: new ParameterCache() };
