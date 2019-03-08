module.exports = {
    invalidEvent: { applicationCode: 'InvalidEvent', message: 'invalid event properties', statusCode: 400 },
    internalServer: { applicationCode: 'InternalServerError', message: 'an error occurred while processing the request', statusCode: 500 },
    failedToRetrieveParameters: { applicationCode: 'ParamStoreError', message: 'failed to retrieve all parameters from parameter-store', statusCode: 500 },
    pipelines: {
        invalidPropertiesSFO: { applicationCode: 'PipelineError', message: 'invalid properties passed into pipeline. MUST contain bankAccountId', statusCode: 500 },
    },
    flows: {
        featureOptions: {
            invalidFilePostfix: { applicationCode: 'FlowError', message: 'featureOptions: Invalid or missing filePostfix', statusCode: 500 },
            invalidProductId: { applicationCode: 'FlowError', message: 'featureOptions: Invalid or missing productId', statusCode: 500 },
            invalidFeatureOptions: { applicationCode: 'FlowError', message: 'featureOptions: Invalid or missing featureOptions', statusCode: 500 },
        }
    }
};
