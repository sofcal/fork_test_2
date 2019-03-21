const sinon = require('sinon');
const { ErrorSpecs } = require('@sage/bc-independent-lambda-handler');
const { StatusCodeError } = require('@sage/bc-status-code-error');
const should = require('should');
const config = require('../../../lib/validators/config');

describe('Checking config', () => {

    const doNothing = () => {};

    let spyErr;

    let logger = {
        info: doNothing,
        error: doNothing
    };

    beforeEach( () => {
        spyErr = sinon.spy(StatusCodeError, 'CreateFromSpecs');
    })

    afterEach( () => {
        sinon.restore();
    })
    it('should throw an error if the config is not present', () => {
        try {
            config(undefined, {logger});
        } catch( err ){ }
        should(spyErr.callCount).eql(1);
    });

    it('should throw an error if the config is not present', () => {
        try {
            config({}, {logger});
        } catch( err ){ }
        should(spyErr.callCount).eql(1);
    });

    it('should throw an error if the certExpiry is not present', () => {
        try {
            config({ cacheExpiry: 100 }, {logger});
        } catch( err ){ }
        should(spyErr.callCount).eql(1);
    });

    it('should throw an error if the cacheExpiry is not present', () => {
        try {
            config({ certExpiry: 100 }, {logger});
        } catch( err ){ }
        should(spyErr.callCount).eql(1);
    });

    it('should NOT throw an error if the config is valid', () => {
        try {
            config({ cacheExpiry: 100, certExpiry: 100 }, {logger});
        } catch( err ){ }
        should(spyErr.callCount).eql(0);
    });

});