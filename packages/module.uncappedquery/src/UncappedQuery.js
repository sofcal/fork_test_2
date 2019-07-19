'use strict';

const util = require('util');

module.exports = function(Query) {
    const defaultCount = 100;

    function UncappedQuery(startIndex, count, where) {
        UncappedQuery.super_.call(this, startIndex, count, where);
    }

    util.inherits(UncappedQuery, Query);

    let p = UncappedQuery.prototype;

    p.validate = function(){
        if (this.startIndex < 0 || this.startIndex === undefined || isNaN(this.startIndex)){
            this.startIndex = 0;
        }

        if (this.count <= 0 || this.count === undefined || isNaN(this.count)) {
            this.count = defaultCount;
        }
    };

    return UncappedQuery;
};
