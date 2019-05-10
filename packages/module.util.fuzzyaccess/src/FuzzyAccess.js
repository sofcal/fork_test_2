'use strict';

const _ = require('underscore');

class FuzzyAccess {
    static Get(obj, key) {
        return _.find(obj, (v, k) => k.toLowerCase() === key.toLowerCase());
    }

    static GetMany(obj, keys) {
        const ret = {};
        _.each(keys, (key) => {
            ret[key] = FuzzyAccess.Get(obj, key);
        });

        return ret;
    }
}

module.exports = FuzzyAccess;
