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

// check if audience in list of audiences
// returns boolean
utils.audienceInvalid = (aud, validAudiences) => !validAudiences.includes(aud);

// check if clientId in list of valid clientIds
// returns boolean
utils.clientInvalid = (azp, validClientIds) => !validClientIds.includes(azp);

utils.scopeInvalid = (scope, validScopes) => !validScopes.includes();

// Validate token header and payload
// returns boolean
utils.validateToken = ({ payload: { exp, iss, aud, azp, scope } = {}, header: { alg = 'none' } = {} } = {}, validIssuers, validAudiences, validClients, validScopes) => {
    // check for expired token
    if (utils.expired(exp)) {
        throw new Error('authTokenExpired');
    }
    // check algorithm used to encode - for unsigned tokens this will be set to 'none'
    if (alg === 'none') {
        throw new Error('invalidAuthToken');
    }
    // check if issuer recognised
    if (utils.issuerInvalid(iss, validIssuers)) {
        throw new Error('authTokenIssuerInvalid');
    }
    // check if audience recognised
    if (utils.audienceInvalid(aud, validAudiences)) {
        throw new Error('authTokenAudienceInvalid');
    }
    // check if client recognised
    if (validClients && utils.clientInvalid(azp, validClients)) {
        throw new Error('authTokenClientInvalid');
    }
    // check if scope is appropriate
    if (validScopes && utils.scopeInvalid(scope, validScopes)) {
        throw new Error('authTokenScopeInvalid');
    }

    return true;
};

module.exports = utils;
