'use strict';

const _ = require('underscore');

module.exports = (template, claims, defaultValue = '') => {
    let ret = template ? template.toString() : (defaultValue);

    _.each(_.keys(claims), (key) => {
        const token = `\${${key}}`;
        let index = -1; // to allow for the first conditional check
        let turnLimit = 0;
        while ((index = ret.indexOf(token, index + 1)) > -1 && (++turnLimit) <= 3) { // eslint-disable-line no-cond-assign, no-plusplus
            ret = ret.replace(token, claims[key]);
        }
    });

    return ret;
};
