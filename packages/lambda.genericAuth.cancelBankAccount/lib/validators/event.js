'use strict';

const ErrorSpecs = require('../ErrorSpecs');

module.exports = (event) => {
    if (!event.body || !event.body.providerId || !event.body.bankAccountId) {
        throw Error('Invalid Event');
    }
};
