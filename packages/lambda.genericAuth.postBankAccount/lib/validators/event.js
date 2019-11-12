'use strict';

const ErrorSpecs = require('../ErrorSpecs');

module.exports = (event) => {
    console.log('AG Test: Into Event Validator');
    const valid = true;

    if (!valid) {
        console.log('AG TEST - Validation Error');
        throw Error('Something');
    }
};
