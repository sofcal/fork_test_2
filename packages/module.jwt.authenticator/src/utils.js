'use strict';

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

module.exports = utils;
