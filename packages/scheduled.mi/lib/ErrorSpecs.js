module.exports = {
    invalidEvent: { applicationCode: 'InvalidEvent', message: 'invalid event properties', statusCode: 400 },
    internalServer: { applicationCode: 'InternalServerError', message: 'an error occurred while processing the request', statusCode: 500 },
    failedToRetrieveParameters: { applicationCode: 'ParamStoreError', message: 'failed to retrieve all parameters from parameter-store', statusCode: 500 },
    pipelines: {
        invalidPropertiesOCB: { applicationCode: 'PipelineError', message: 'invalid properties passed into pipeline. MUST contain organisationId OR productId', statusCode: 500 },
        invalidPropertiesTS: { applicationCode: 'PipelineError', message: 'invalid properties passed into pipeline. MUST contain bankAccountId', statusCode: 500 },
    }
};
