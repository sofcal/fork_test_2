const { logger: loggerGen } = require('@sage/bc-debug-utils');
const { ErrorSpecs } = require('@sage/bc-independent-lambda-handler');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');
const should = require('should');
const validate = require('../../../lib/validators/config');

describe('@sage/sfab-s2s-jwt-jwks-lambda.validators.config', () => {

    const logger = loggerGen(false);
    const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidConfig], ErrorSpecs.invalidConfig.statusCode);

    it('should throw an error if the config is not present', () => {
        should(() => validate(undefined, { logger })).throwError(expected);
    });

    it('should throw an error if the config is not present', () => {
        should(() => validate({ }, { logger })).throwError(expected);
    });

    it('should throw an error if the certExpiry is not present', () => {
        should(() => validate({ cacheExpiry: 100 }, { logger })).throwError(expected);
    });

    it('should throw an error if the cacheExpiry is not present', () => {
        should(() => validate({ certExpiry: 100 }, { logger })).throwError(expected);
    });

    it('should NOT throw an error if the config is valid', () => {
        should(() => validate({ cacheExpiry: 100, certExpiry: 100 }, { logger })).not.throw();
    });
});