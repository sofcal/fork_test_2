'use strict';

module.exports = function(Query) {
    const UncappedQuery = require('./UncappedQuery')(Query);

    return { Query, UncappedQuery };
};
