module.exports = {
    invalidEvent: {
        applicationCode: 'InvalidEvent',
        message: 'invalid event properties',
        statusCode: 400
    },
    authTokenNotFound: {
        applicationCode: 'NoAuthToken',
        message: 'Auth token not found',
        statusCode: 400
    },
    authTokenExpired: {
        applicationCode: 'AuthTokenExpired',
        message: 'Auth token expired',
        statusCode: 400
    },
    authTokenIssuerInvalid: {
        applicationCode: 'authTokenIssuerInvalid',
        message: 'Auth token issuer invalid',
        statusCode: 400
    },
    authTokenInvalid: {
        applicationCode: 'AuthTokenInvalid',
        message: 'Auth token invalid',
        statusCode: 400
    },
    AuthFailed: {
        applicationCode: 'AuthFailed',
        message: 'Auth failed',
        statusCode: 401
    },
    internalServer: {
        applicationCode: 'InternalServerError',
        message: 'an error occurred while processing the request',
        statusCode: 500
    },
    failedToRetrieveParameters: {
        applicationCode: 'ParamStoreError',
        message: 'failed to retrieve all parameters from parameter-store',
        statusCode: 500
    },
    unknownError: {
        applicationCode: 'InternalServerError',
        message: 'an error occurred while processing the request',
        statusCode: 500
    },
};
