'use strict';

module.exports = (function() {
    const ns = {};

    ns.operations = {
        containsWords: 'containsWords',
        contains: 'contains',
        doesNotContain: 'notcontains',
        eq: 'eq',
        gt: 'gt',
        lt: 'lt',
        gte: 'ge',
        lte: 'le'
    };

    Object.freeze(ns);
    return ns;
}());