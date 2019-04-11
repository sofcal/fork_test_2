const _ = require('underscore');

const intersection = (key, ...arr) => {
    const keys = (arr.map((a) => _.without(_.pluck(a, key), undefined)));
    const allKeys = _.intersection(...keys);
    return _.filter(arr[0], (item) => _.contains(allKeys, item[key]));
};

module.exports = {
    intersection,
};
