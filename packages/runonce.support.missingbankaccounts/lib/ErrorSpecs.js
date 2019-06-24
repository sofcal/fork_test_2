module.exports = {
    invalidConfig: { applicationCode: 'invalidConfig', message: 'invalid config properties', statusCode: 400 },
    invalidEvent: {
        bucket: { applicationCode: 'InvalidEvent', message: 'invalid event properties: missing bucket', statusCode: 400 },
        key: { applicationCode: 'InvalidEvent', message: 'invalid event properties: missing key', statusCode: 400 },
        destination: { applicationCode: 'InvalidEvent', message: 'invalid event properties: missing destination', statusCode: 400 }
    },
    notFound: {
        accountIdentifiers: { applicationCode: 'NotFound', message: 'account identifiers not found', statusCode: 404 }
    },
    internalServer: { applicationCode: 'InternalServerError', message: 'an error occurred while processing the request', statusCode: 500 },
    failedToRetrieveParameters: { applicationCode: 'ParamStoreError', message: 'failed to retrieve all parameters from parameter-store', statusCode: 500 },
};
