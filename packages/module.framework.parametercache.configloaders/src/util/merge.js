'use strict';

const _ = require('underscore');

const merge = (config, overrides) => mergeObjects(config, overrides);

const mergeObjects = (obj1, obj2) => {
    const obj1Keys = _.keys(obj1);
    const obj2Keys = _.keys(obj2);
    const keys = _.difference(obj2Keys, obj1Keys);
    const result = {};

    _.each(obj1Keys, (key) => {
        const obj1Value = obj1[key];
        const obj2Value = obj2[key];
        if (_.isArray(obj1Value) && _.isArray(obj2Value)) {
            result[key] = mergeArrays(obj1Value, obj2Value);
        } else if (_.isObject(obj1Value) && _.isObject(obj2Value)) {
            result[key] = mergeObjects(obj1Value, obj2Value);
        } else if (!obj2Value) {
            result[key] = obj1Value;
        } else if (obj2Value) {
            result[key] = obj2Value;
        } else {
            throw new Error('not implemented');
        }
    });

    _.each(keys, (obj2Key) => {
        result[obj2Key] = obj2[obj2Key];
    });

    return result;
};

const mergeArrays = (array1, array2) => {
    const limit = array1.length > array2.length ? array1.length : array2.length;
    const result = [];

    for (let i = 0; i < limit; i++) {
        const array1Item = array1[i];
        const array2Item = array2[i];
        let resultItem;

        if (_.isArray(array1Item) && _.isArray(array2Item)) {
            resultItem = mergeArrays(array1Item, array2Item);
        } else if (_.isObject(array1Item) && _.isObject(array2Item)) {
            resultItem = mergeObjects(array1Item, array2Item);
        } else if (!array2Item) {
            resultItem = array1Item;
        } else {
            resultItem = array2Item;
        }

        result.push(resultItem);
    }

    return result;
};

module.exports = merge;
