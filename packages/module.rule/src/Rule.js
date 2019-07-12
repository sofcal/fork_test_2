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

    ns.types = {
        user: 'User',
        accountant: 'Accountant',
        feedback: 'Feedback',
        global: 'Global'
    };

    Object.freeze(ns);
    return ns;
}());