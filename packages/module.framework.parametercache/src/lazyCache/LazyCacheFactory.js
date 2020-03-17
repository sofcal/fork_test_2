'use strict';

const LazyCache = require('./LazyCache');

const lazyCaches = [];

class LazyCacheFactory {
    static create(options){
        const lc = new LazyCache(options);
        lazyCaches.push(lc);
        return lc;
    }
}

module.exports = LazyCacheFactory;