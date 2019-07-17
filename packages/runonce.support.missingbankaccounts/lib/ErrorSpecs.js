module.exports = {
    invalidConfig: { applicationCode: 'invalidConfig', message: 'invalid config properties', statusCode: 400 },
    invalidEvent: {
        event: { applicationCode: 'InvalidEvent', message: 'invalid event: missing event', statusCode: 400 },
        bucket: { applicationCode: 'InvalidEvent', message: 'invalid event properties: missing bucket', statusCode: 400 },
        key: { applicationCode: 'InvalidEvent', message: 'invalid event properties: missing key', statusCode: 400 },
        bank: { applicationCode: 'InvalidEvent', message: 'invalid event properties: missing bank', statusCode: 400 }
    },
    invalidExtractorInput: {
        body: { applicationCode: 'InvalidExtractorInput', message: 'invalid extractor input: missing Body', statusCode: 400 }
    },
    notFound: {
        accountIdentifiers: { applicationCode: 'NotFound', message: 'account identifiers not found', statusCode: 404 },
        s3Error: { applicationCode: 'NotFound', message: 'error from S3', statusCode: 404 }
    },
    internalServer: { applicationCode: 'InternalServerError', message: 'an error occurred while processing the request', statusCode: 500 },
    failedToRetrieveParameters: { applicationCode: 'ParamStoreError', message: 'failed to retrieve all parameters from parameter-store', statusCode: 500 },
    failedToWriteToS3: { applicationCode: 'S3WriteError', message: 'failed to write file to s3', statusCode: 400 },
    failedToReadDb: { applicationCode: 'DBReadError', message: 'failed to read from the database', statusCode: 400 }
};