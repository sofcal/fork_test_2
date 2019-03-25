'use strict';

const utils = {};

// check if exp date has passed
// returns boolean
utils.expired = (exp) => {
    const now = Math.floor(Date.now() / 1000);
    return typeof exp !== 'undefined' && exp < now;
};

// check if issuer in list of valid issuers
// returns boolean
utils.issuerInvalid = (iss, validIssuers) => !validIssuers.includes(iss);

// Validate token header and payload
// returns boolean
utils.validateToken = ({ payload: { exp, iss } = {}, header: { alg = 'none' } = {} } = {}, validIssuers) => {
    // check for expired token
    if (utils.expired(exp)) {
        throw new Error('authTokenExpired');
    }
    // check if issuer recognised
    if (utils.issuerInvalid(iss, validIssuers)) {
        throw new Error('authTokenIssuerInvalid');
    }
    // check algorithm used to encode - for unsigned tokens this will be set to 'none'
    if (alg === 'none') {
        throw new Error('invalidAuthToken');
    }
    return true;
};

module.exports = utils;
