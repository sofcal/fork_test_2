const { ErrorSpecs } = require('@sage/bc-independent-lambda-handler');

module.exports = Object.assign({}, ErrorSpecs, {
    failedToRetrieveParameters: { applicationCode: 'ParamStoreError', message: 'failed to retrieve all parameters from parameter-store', statusCode: 500 },
});
