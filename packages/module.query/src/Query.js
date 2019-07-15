'use strict';
module.exports = function() {
    var maxCount = 50;

    function Query(startIndex, count, where) {
        this.startIndex = parseInt(startIndex, 10);
        this.count = parseInt(count, 10);
        this.where = where ? where : {};
        this.orderBy = undefined;
        this.groupBy = undefined;
        this.projection = undefined;

        this.validate();
    }
    let p = Query.prototype;

    p.validate = function() {
        if (this.startIndex < 0 || this.startIndex === undefined || isNaN(this.startIndex)) {
            this.startIndex = 0;
        }

        if (this.count <= 0 || this.count > maxCount || this.count === undefined || isNaN(this.count)) {
            this.count = maxCount;
        }
    };

    return Query;
};
