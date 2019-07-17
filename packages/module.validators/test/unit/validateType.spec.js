const { StatusCodeErrorItem } = require('@sage/bc-statuscodeerror');
const should = require('should');
const { validateTypeNoThrow } = require('../../lib');

describe('@sage/bc-validators.validateType', () => {
    describe('validateTypeNoThrow', () => {
        class Test {
            constructor(val1, val2) {
                this.val1 = val1;
                this.val2 = val2;
            }
        }

        it('should return undefined for valid object', () => {
            const obj = new Test(1, 2);
            const result = validateTypeNoThrow(obj, Test);

            should(result).be.undefined();
        });

        it('should return error if no object passed in (property passed in)', () => {
            const prop = {
                prefix: 'preTest',
                path: 'pathTest'
            };
            const result = validateTypeNoThrow(undefined, Test, prop);

            should(result).be.instanceOf(StatusCodeErrorItem);
            should(result).have.property('applicationCode', 'InvalidProperties');
            should(result).have.property('message', `${prop.prefix}.${prop.path}: ${undefined}`);
        });

        it('should return error if no object passed in (no property passed in)', () => {
            const result = validateTypeNoThrow(undefined, Test);

            should(result).be.instanceOf(StatusCodeErrorItem);
            should(result).have.property('applicationCode', 'InvalidType');
            should(result).have.property('message', `Expected object of type: ${Test.name}`);
        });

        it('should return error if object not instance of type', () => {
            const obj = new Test(1, 2);
            const result = validateTypeNoThrow(obj, Error);

            should(result).be.instanceOf(StatusCodeErrorItem);
            should(result).have.property('message', `Expected object of type: ${Error.name}`);
        });

        it('should return error if object is a function', () => {
            const obj = () => undefined;
            const result = validateTypeNoThrow(obj, Test);

            should(result).be.instanceOf(StatusCodeErrorItem);
            should(result).have.property('message', `Expected object of type: ${Test.name}`);
        });

        it('should return error if object is an array', () => {
            const obj = [];
            const result = validateTypeNoThrow(obj, Test);

            should(result).be.instanceOf(StatusCodeErrorItem);
            should(result).have.property('message', `Expected object of type: ${Test.name}`);
        });
    });
});
