module.exports = {
    internalServer: { applicationCode: 'InternalServerError', message: 'an error occurred while processing the request', statusCode: 500 },
    invalidEvent: { applicationCode: 'InvalidEvent', message: 'invalid event properties', statusCode: 400 },
    failedToRetrieveParameters: { applicationCode: 'ParamStoreError', message: 'failed to retrieve all parameters from parameter-store', statusCode: 500 },

    noDataFilesToProcess: { applicationCode: 'NoDataFiles', message: 'there were no data files found to process within the period', statusCode: 404 },
    noDataGenerated: { applicationCode: 'NoDataGenerated', message: 'there was no data generated after concatenating files', statusCode: 409 }
};
