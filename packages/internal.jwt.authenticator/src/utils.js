'use strict';

const expired = (exp) => {
    const now = Date.now() / 1000;
    return typeof exp !== 'undefined' && exp < now;
};

const issuerInvalid = (iss, validIssuers) => validIssuers.includes(iss);

const validateToken = (exp = 0, iss = '', validIssuers = []) => {
    if (expired(exp)) {
        throw new Error('authTokenExpired');
    }
    if (issuerInvalid(iss, validIssuers)) {
        throw new Error('authTokenIssuerInvalid');
    }
};

const firstValid = (arr, fn) => {
    arr.some((el) => {
        try {
            fn(el);
            return true;
        } catch (e) {
            return false;
        }
    });
}

const partial = (fn, arg) => (args) => fn(arg, ...args);

module.exports = {
    expired,
    issuerInvalid,
    validateToken,
    firstValid,
    partial,
};
