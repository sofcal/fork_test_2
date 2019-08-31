'use strict';

const _ = require('underscore');

/**
 * Takes an array of objects of that represent properties on the contract and provides a set of filters that can be
 *  used in other contract api utils. Such as 'extend' and 'filter'
 * @param settings: [{ canCreate: bool, canUpdate: bool, canReturn: bool, id: 'property_name' }]
 */
module.exports = (settings) => {
    const post = mapKeys(settings, (k) => k.canCreate);
    const update = mapKeys(settings, (k) => k.canUpdate);
    const readOnly = mapKeys(settings, (k) => !k.canUpdate);
    const returned = mapKeys(settings, (k) => k.canReturn);

    return { post, update, readOnly, returned };
};

// helper function which filters and extracts ids based on a provided function
const mapKeys = (keys, filterFunc) => _.chain(keys).filter(filterFunc).map((k) => k.id).value();
