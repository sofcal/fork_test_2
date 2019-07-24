const sinon = require('sinon');
const { ErrorSpecs } = require('@sage/bc-independent-lambda-handler');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');
const should = require('should');
const validate = require('../../../lib/validators/config');

describe('lambda-jwt-jwks.validators.config', () => {

    const doNothing = () => {};

    let spyErr;

    let logger = {
        info: doNothing,
        error: doNothing
    };

    const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidConfig], ErrorSpecs.invalidConfig.statusCode);

    beforeEach( () => {
        spyErr = sinon.spy(StatusCodeError, 'CreateFromSpecs');
    });

    afterEach( () => {
        sinon.restore();
    });

    it('should throw an error if the config is not present', () => {
        should(() => validate(undefined, { logger })).throwError(expected);
    });

    it('should throw an error if the config is not present', () => {
        should(() => validate({}, { logger })).throwError(expected);
    });

    it('should throw an error if the certExpiry is not present', () => {
        should(() => validate({ cacheExpiry: 100 }, { logger })).throwError(expected);
    });

    it('should throw an error if the cacheExpiry is not present', () => {
        should(() => validate({ certExpiry: 100 }, { logger })).throwError(expected);
    });

    it('should NOT throw an error if the config is valid', () => {
        should(() => validate({ cacheExpiry: 100 }, { logger })).not.throw();
    });

});