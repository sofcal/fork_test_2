'use strict';

const needle = require('needle');

const utils = {};

// check if exp date has passed
// returns boolean
utils.expired = (exp) => {
    const now = Date.now() / 1000;
    return typeof exp !== 'undefined' && exp < now;
};

// check if issuer in list of valid issuers
// returns boolean
utils.issuerInvalid = (iss, validIssuers) => !validIssuers.includes(iss);

// check expiry date and issuer
// returns boolean
utils.validateToken = (exp, iss, validIssuers) => {
    if (utils.expired(exp)) {
        throw new Error('authTokenExpired');
    }
    if (utils.issuerInvalid(iss, validIssuers)) {
        throw new Error('authTokenIssuerInvalid');
    }
    return true;
};

// Returns true when first element passes predicate test
// returns boolean
utils.anyValid = (arr = [], predicate) =>
    arr.some((el) => {
        try {
            predicate(el);
            return true;
        } catch (e) {
            return false;
        }
    });

// partial function application
// returns function
utils.partial = (fn, arg) => (...args) => fn(arg, ...args);

// Refresh function - calls needle get using endpoint argument
// returns promise
utils.refreshFn = function(endpoint) {
    return Promise.resolve()
        .then(() => needle('get', endpoint))
        .catch((err) => {
            /* eslint-disable no-console */
            console.log(`alert: ${err}`);
            throw new Error(`Fetch endpoint error: ${err.message}`);
        });
};

// Mapping function - maps data to internal storage structure
// returns object
utils.mappingFn = (res) => {
    const { keys = [] } = res.body;

    return keys.reduce((final, { kid, x5c }) => {
        return Object.assign(
            {},
            final,
            { [kid]: x5c },
        );
    }, {});
};

module.exports = utils;
