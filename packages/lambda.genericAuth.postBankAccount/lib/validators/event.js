'use strict';

const ErrorSpecs = require('../ErrorSpecs');

module.exports = (event) => {
    const valid = true;

    if (!valid) {
        throw Error('Something');
    }
};
