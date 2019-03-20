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

// check expiry date and issuer
// returns boolean
utils.validateToken = ({ payload: { exp, iss } = {}, header: { alg } = {} } = {}, validIssuers) => {
    if (utils.expired(exp)) {
        throw new Error('authTokenExpired');
    }
    if (utils.issuerInvalid(iss, validIssuers)) {
        throw new Error('authTokenIssuerInvalid');
    }
    if (alg === 'none') {
        throw new Error('invalidAuthToken');
    }
    return true;
};

module.exports = utils;
