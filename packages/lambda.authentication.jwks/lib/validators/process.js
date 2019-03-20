'use strict';

const { ErrorSpecs } = require('@sage/bc-independent-lambda-handler');
const { StatusCodeError } = require('@sage/bc-status-code-error');

module.exports = ({ config }) => {
    // TODO: are we getting these values from process or param-store?
    if (!config || !config.iss || !config.newCertDelay) {
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEnvironment], ErrorSpecs.invalidEnvironment.statusCode);
    }
};
