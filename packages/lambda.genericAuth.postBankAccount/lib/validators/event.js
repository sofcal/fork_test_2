'use strict';

const ErrorSpecs = require('../ErrorSpecs');

module.exports = (event) => {
    console.log('AG Test: Into Event');
    const valid = true;

    if (!valid) {
        consle.log('AG TEST - Validation Error');
        throw Error('Something');
    }
};
