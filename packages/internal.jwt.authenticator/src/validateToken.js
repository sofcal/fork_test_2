'use strict';

const expired = (exp) => {
    const now = Date.now().valueOf() / 1000;
    return typeof exp !== 'undefined' && exp < now;
};

const issuerInvalid = (iss, validIssuers) => validIssuers.includes(iss);

module.exports = (exp = 0, iss = '', validIssuers = []) => {
    if (expired(exp)) {
        throw new Error('authTokenExpired');
    }
    if (issuerInvalid(iss, validIssuers)) {
        throw new Error('authTokenIssuerInvalid');
    }
};
