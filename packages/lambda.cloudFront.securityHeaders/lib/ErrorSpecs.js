module.exports = {
    internalServer: { applicationCode: 'InternalServerError', message: 'an error occurred while processing the request', statusCode: 500 },
    invalidEvent: { applicationCode: 'InvalidEvent', message: 'invalid event properties', statusCode: 400 },
    failedToRetrieveParameters: { applicationCode: 'ParamStoreError', message: 'failed to retrieve all parameters from parameter-store', statusCode: 500 },

    generalError: { applicationCode: 'Error', message: 'an error occurred adding headers', statusCode: 400 }
};
