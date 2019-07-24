const { ErrorSpecs } = require('@sage/bc-independent-lambda-handler');

module.exports = Object.assign({}, ErrorSpecs, {
    authTokenNotFound: { applicationCode: 'NoAuthToken', message: 'Auth token not found', statusCode: 400 },
    authTokenExpired: { applicationCode: 'AuthTokenExpired', message: 'Auth token expired', statusCode: 400 },
    authTokenIssuerInvalid: { applicationCode: 'authTokenIssuerInvalid', message: 'Auth token issuer invalid', statusCode: 400 },
    authTokenInvalid: { applicationCode: 'AuthTokenInvalid', message: 'Auth token invalid', statusCode: 400 },
    AuthFailed: { applicationCode: 'AuthFailed', message: 'Auth failed', statusCode: 401 }
});
