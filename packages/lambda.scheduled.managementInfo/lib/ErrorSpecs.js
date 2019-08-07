module.exports = {
    invalidEvent: { applicationCode: 'InvalidEvent', message: 'invalid event properties', statusCode: 400 },
    internalServer: { applicationCode: 'InternalServerError', message: 'an error occurred while processing the request', statusCode: 500 },
    failedToRetrieveParameters: { applicationCode: 'ParamStoreError', message: 'failed to retrieve all parameters from parameter-store', statusCode: 500 },
    pipelines: {
        invalidPropertiesOCB: { applicationCode: 'PipelineError', message: 'invalid properties passed into pipeline. MUST contain organisationId OR productId', statusCode: 500 },
        invalidPropertiesTS: { applicationCode: 'PipelineError', message: 'invalid properties passed into pipeline. MUST contain bankAccountId', statusCode: 500 },
    },
    flows: {
        orphans: {
            transactionFailure: { applicationCode: 'FlowError', message: 'Orphans: Failed to retrieve transaction information for orphaned accounts. Processing cannot continue', statusCode: 500 }
        },
        product: {
            transactionFailure: { applicationCode: 'FlowError', message: 'Product: failed to pull transaction summaries for one or more accounts. Processing cannot continue', statusCode: 500 }
        },
        concat: {
            orphansFailure: { applicationCode: 'FlowError', message: 'Concat: Failed to retrieve and merge orphans. Processing cannot continue', statusCode: 500 },
            productFailure: { applicationCode: 'FlowError', message: 'Concat: Failed to retrieve and merge results for product', statusCode: 500 }
        },
        sitesNotSupported: {
            sitesNotSupportedFailure: { applicationCode: 'FlowError', message: 'SitesNotSupported: Failed to retrieve bank accounts with siteNotSupported set', statusCode: 500 }
        }
    }
};
