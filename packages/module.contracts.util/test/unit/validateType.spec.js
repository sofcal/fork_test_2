'use strict';

const validateType = require('../../lib/validateType');

const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-common-statuscodeerror');

const should = require('should');

describe('@sage/bc-contracts-util.validateType', function() {
    class TestType {}
    const expectedItem = StatusCodeErrorItem.Create('InvalidType', 'Expected object of type: TestType');
    const expectedError = StatusCodeError.Create([expectedItem], 400);

    describe('noThrow=true', () => {
        it('should return a StatusCodeErrorItem if obj is a function', () => {
            should(validateType({ obj: () => {}, Type: TestType, noThrow: true })).eql(expectedItem);
        });

        it('should return a StatusCodeErrorItem if obj is an array', () => {
            should(validateType({ obj: [], Type: TestType, noThrow: true })).eql(expectedItem);
        });

        it('should return a StatusCodeErrorItem if obj is undefined', () => {
            should(validateType({ obj: undefined, Type: TestType, noThrow: true })).eql(expectedItem);
        });

        it('should return a StatusCodeErrorItem if obj is null', () => {
            should(validateType({ obj: null, Type: TestType, noThrow: true })).eql(expectedItem);
        });

        it('should return a StatusCodeErrorItem if object is not correct Type', () => {
            should(validateType({ obj: {}, Type: TestType, noThrow: true })).eql(expectedItem);
        });

        it('should return undefined if valid', () => {
            should(validateType({ obj: new TestType(), Type: TestType, noThrow: true })).eql(undefined);
        });
    });

    describe('noThrow=false', () => {
        it('should throw if obj is a function', () => {
            should(() => validateType({ obj: () => {}, Type: TestType })).throw(expectedError);
        });

        it('should throw if obj is an array', () => {
            should(() => validateType({ obj: [], Type: TestType })).throw(expectedError);
        });

        it('should throw if obj is undefined', () => {
            should(() => validateType({ obj: undefined, Type: TestType })).throw(expectedError);
        });

        it('should throw if obj is null', () => {
            should(() => validateType({ obj: null, Type: TestType })).throw(expectedError);
        });

        it('should throw if object is not correct Type', () => {
            should(() => validateType({ obj: {}, Type: TestType })).throw(expectedError);
        });

        it('should return undefined if valid', () => {
            should(validateType({ obj: new TestType(), Type: TestType })).eql(undefined);
        })
    });
});
