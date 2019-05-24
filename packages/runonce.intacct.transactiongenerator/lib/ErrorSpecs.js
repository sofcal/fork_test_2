module.exports = {
    invalidConfig: { applicationCode: 'invalidConfig', message: 'invalid config properties', statusCode: 400 },
    invalidEvent: {
        missingBankAccount: { applicationCode: 'InvalidEvent', message: 'invalid event properties: missing bankAccountId', statusCode: 400 },
        missingStartTrxNo: { applicationCode: 'InvalidEvent', message: 'invalid event properties: missing startTrxNo', statusCode: 400 },
        missingNumTrxToCreate: { applicationCode: 'InvalidEvent', message: 'invalid event properties: missing numTrxToCreate', statusCode: 400 }
    },
    notFound: {
        bankAccount: { applicationCode: 'NotFound', message: 'bankAccount not found', statusCode: 404 }
    },
    internalServer: { applicationCode: 'InternalServerError', message: 'an error occurred while processing the request', statusCode: 500 },
    failedToRetrieveParameters: { applicationCode: 'ParamStoreError', message: 'failed to retrieve all parameters from parameter-store', statusCode: 500 },
};
