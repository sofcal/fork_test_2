'use strict';

const ErrorSpecs = require('../ErrorSpecs');

module.exports = (event) => {
    if (!event) {
        throw Error('Invalid Event');
    }
};
