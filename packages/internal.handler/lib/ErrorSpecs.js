module.exports = {
  invalidEvent: {
    applicationCode: 'InvalidEvent',
    message: 'invalid event properties',
    statusCode: 400
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
  }
};