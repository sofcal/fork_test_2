const validateContract = require('../../lib/validatorContractObject');
const validateType = require('../../lib/validateType');
const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-common-statuscodeerror');
const { services: { common: { InvalidType } } } = require('@sage/bc-common-resources');

const should = require('should');
const sinon = require('sinon');
const _ = require('underscore');

describe('@sage/bc-services-validators.validateContractObject', () => {
    let sandbox;

    before((done) => {
        sandbox = sinon.createSandbox();
        done();
    });

    afterEach((done) => {
        sandbox.restore();
        done();
    });

    describe('validateContractObjectNoThrow', () => {
        describe('Empty inputs', () => {
            it('should return empty array if no properties passed in', () => {
                sandbox.spy(_, 'isArray');
                const obj = null;
                const type = Object;
                const properties = [];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);
                should(result).be.an.Array().which.is.empty();
                should(_.isArray.callCount).be.eql(0);
            });
        });

        describe('validate arrays', () => {
            it('should allow empty arrays if allowEmptyArray property set', () => {
                sandbox.spy(_, 'isArray');
                const obj = {
                    testArray: []
                };
                const type = Object;
                const properties = [
                    { path: 'testArray', allowEmptyArray: true }
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);
                should(result).be.an.Array().which.is.empty();
                should(_.isArray.callCount).be.eql(1);
            });

            it('should allow empty arrays if optional property set', () => {
                const obj = {
                    testArray: []
                };
                const type = Object;
                const properties = [
                    { path: 'testArray', optional: true }
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);
                should(result).be.an.Array().which.is.empty();
            });

            it('should pass validation if custom array method returns no results', () => {
                const obj = {
                    testArray: [
                        'test1',
                        'test2',
                    ],
                };
                const type = Object;
                const arrayCustom = sandbox.stub().returns(undefined);
                const properties = [
                    { path: 'testArray', arrayCustom }
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);

                should(result).be.an.Array().which.is.empty();
                should(arrayCustom.calledOnce).be.eql(true, 'array custom method should be called once');
            });

            it('should fail validation if custom array method returns results', () => {
                const obj = {
                    testArray: [
                        'test1',
                        'test2',
                    ],
                };
                const type = Object;
                const arrayCustom = sandbox.stub().callsFake(x => x);
                const properties = [
                    { path: 'testArray', arrayCustom }
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);

                should(result).be.an.Array().of.length(obj.testArray.length);
                should(arrayCustom.calledOnce).be.eql(true, 'array custom method should be called once');
            });

            it('should fail validation if custom array method passed with a non-array object', () => {
                const obj = {
                    testArray: 'test1',
                };
                const type = Object;
                const arrayCustom = sandbox.stub().callsFake(x => x);
                const properties = [
                    { path: 'testArray', arrayCustom }
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);

                should(result).be.an.Array().of.length(1);
                should(result[0]).be.instanceOf(StatusCodeErrorItem);
                should(arrayCustom.called).be.eql(false, 'array custom method should not be called');
            });

            it('should fail validation for empty arrays if optional property not set', () => {
                const obj = {
                    testArray: []
                };
                const type = Object;
                const properties = [
                    { path: 'testArray' }
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);

                should(result).be.an.Array().of.length(1);
                should(result[0]).be.instanceOf(StatusCodeErrorItem);
            });
        });

        describe('optional properties', () => {
            it('should allow undefined values when optional flag is set', () => {
                const obj = {
                    test: undefined
                };
                const type = Object;
                const properties = [
                    { path: 'test', optional: true }
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);
                should(result).be.an.Array().which.is.empty();
            });

            it('should allow null values when optional and allowNull flags are set', () => {
                const obj = {
                    test: null
                };
                const type = Object;
                const properties = [
                    { path: 'test', optional: true, allowNull: true }
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);
                should(result).be.an.Array().which.is.empty();
            });

            it('should fail validation for undefined values when optional flag is not set', () => {
                const obj = {
                    test: undefined
                };
                const type = Object;
                const properties = [
                    { path: 'test' }
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);

                should(result).be.an.Array().of.length(1);
                should(result[0]).be.instanceOf(StatusCodeErrorItem);
            });

            it('should fail validation for null values when allowNull flag not set', () => {
                const obj = {
                    test: null
                };
                const type = Object;
                const properties = [
                    { path: 'test', optional: true }
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);

                should(result).be.an.Array().of.length(1);
                should(result[0]).be.instanceOf(StatusCodeErrorItem);
            });

            it('should allow undefined values when conditional property returns false', () => {
                const obj = {
                    test: undefined
                };
                const type = Object;
                const properties = [
                    { path: 'test', conditional: () => false }
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);
                should(result).be.an.Array().which.is.empty();
            });
        });

        describe('regex testing', () => {
            it('should allow values that pass regex test', () => {
                const obj = {
                    test: [
                        'test1',
                        'test2',
                    ],
                };
                const type = Object;
                const properties = [
                    { path: 'test', regex: /^test/ }
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);

                should(result).be.an.Array().which.is.empty();
            });

            it('should fail validation where regex param set but value is not a string', () => {
                const obj = {
                    test: [
                        123,
                        456,
                    ],
                };
                const type = Object;
                const properties = [
                    { path: 'test', regex: /^test/ }
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);

                should(result).be.an.Array().of.length(obj.test.length);
                should(result[0]).be.instanceOf(StatusCodeErrorItem);
            });

            it('should fail validation where regex test fails', () => {
                const obj = {
                    test: [
                        'failtest1',
                        'failtest2',
                    ],
                };
                const type = Object;
                const properties = [
                    { path: 'test', regex: /^test/ }
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);

                should(result).be.an.Array().of.length(obj.test.length);
                should(result[0]).be.instanceOf(StatusCodeErrorItem);
            });
        });

        describe('custom validation method', () => {
            it('should allow values that pass custom test', () => {
                const obj = {
                    test: [
                        'test1',
                        'test2',
                    ],
                };
                const type = Object;
                const properties = [
                    { path: 'test', custom: _.isString }
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);

                should(result).be.an.Array().which.is.empty();
            });

            it('should fail validation where custom test fails', () => {
                const obj = {
                    test: [
                        123,
                        456,
                    ],
                };
                const type = Object;
                const properties = [
                    { path: 'test', custom: _.isString }
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);

                should(result).be.an.Array().of.length(obj.test.length);
                should(result[0]).be.instanceOf(StatusCodeErrorItem);
            });
        });

        describe('parent property', () => {
            it('should fail validation where custom test fails', () => {
                const obj = {
                    test: [
                        123,
                        456,
                    ],
                };
                const type = Object;
                const properties = [
                    { path: 'test', custom: _.isString }
                ];
                const parent = 'parent';

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);

                should(result).be.an.Array().of.length(1, 'as parent populated only a single error item should be returned');
                const [err] = result;
                should(err).be.instanceOf(StatusCodeErrorItem);
                should(err).have.property('applicationCode', 'InvalidProperties');
                should(err).have.propertyByPath('params', 'parent', 'test');
            });
        });

        describe('iteration', () => {
            it('should loop through each property (where abandoned option not set)', () => {
                sandbox.spy(_, 'isUndefined');
                sandbox.spy(_, 'isArray');
                const obj = {
                    // test1: undefined,
                    // test2: undefined,
                };
                const type = Object;
                const properties = [
                    { path: 'test1', optional: true },
                    { path: 'test2', optional: true },
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);
                should(result).be.an.Array().which.is.empty();
                should(_.isArray.callCount).eql(properties.length, 'should call isArray for each property passed in');
                should(_.isUndefined.callCount).eql(2, 'should call isUndefined for each value (undefined) passed in');
            });

            it('should loop through each value for each property (where abandoned option not set)', () => {
                sandbox.spy(_, 'isUndefined');
                sandbox.spy(_, 'isNumber');
                const values = [1, 2, 3];
                const obj = {
                    test1: [...values],
                    test2: [...values],
                    test3: [...values],
                };
                const type = Object;
                const properties = [
                    { path: 'test1', optional: true, custom: _.isNumber, },
                    { path: 'test2', optional: true, custom: _.isNumber, },
                    { path: 'test3', optional: true, custom: _.isNumber, },
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);
                should(result).be.an.Array().which.is.empty();
                should(_.isNumber.callCount).eql(Object.keys(obj).length * values.length, 'should call custom validator for each value passed in');
            });

            it('should exit early where abandon flag is set and test fails', () => {
                sandbox.spy(_, 'isUndefined');
                sandbox.spy(_, 'isNumber');
                sandbox.spy(_, 'isString');
                const values = [1, 2, 3];
                const obj = {
                    test1: [...values],
                    test2: [...values],
                    test3: [...values],
                };
                const type = Object;
                const properties = [
                    { path: 'test1', optional: true, custom: _.isNumber, },
                    { path: 'test2', optional: true, custom: _.isString, abandon: true },
                    { path: 'test3', optional: true, custom: _.isNumber, },
                ];
                const parent = null;

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);
                should(result).be.an.Array().of.length(values.length);
                const [first] = result;
                should(first).be.instanceOf(StatusCodeErrorItem);
                should(first).have.property('applicationCode', 'InvalidProperties');
                should(_.isNumber.callCount).eql(values.length, 'should call isNumber custom validator for first three values passed in');
                should(_.isString.callCount).eql(values.length, 'should call isString custom validator for each test2 value');
            });

            it('should call nested function', () => {
                sandbox.spy(_, 'isNumber');
                sandbox.spy(_, 'isString');
                const obj = {
                    test1: [1, 2, 3],
                    test2: {
                        test3: ['1', '2', '3'],
                    },
                };
                const type = Object;
                const parent = null;

                const nestedFunc = (val) => {
                    const nestedProperties = [
                        { path: 'test3', custom: _.isString, optional: false }
                    ];
                    return validateContract.validateContractObjectNoThrow(val, type, nestedProperties, parent);
                };

                const properties = [
                    { path: 'test1', custom: _.isNumber, },
                    { path: 'test2', nested: nestedFunc },
                ];

                const result = validateContract.validateContractObjectNoThrow(obj, type, properties, parent);
                should(result).be.an.Array().which.is.empty();

                should(_.isNumber.callCount).eql(obj.test1.length, 'should call isNumber custom validator for three values of test1');
                should(_.isString.callCount).eql(obj.test2.test3.length, 'should call isString custom validator for each test3 value');
            });
        });
    });

    describe('validateContractObject', () => {
        it('should return undefined if validateContractObjectNoThrow return no items', () => {
            const validateContractObjectNoThrowResponse = [];
            sandbox.stub(validateType, 'validateTypeNoThrow').callsFake(() => {
                const response = undefined;
                console.log(`validateTypeNoThrow stubbed - returning ${response}`);
                return undefined;
            });
            sandbox.stub(validateContract, 'validateContractObjectNoThrow').callsFake(() => {
                console.log(`validateContractObjectNoThrow stubbed - returning ${validateContractObjectNoThrowResponse}`);
                return validateContractObjectNoThrowResponse;
            });

            return Promise.resolve()
                .then(() => validateContract.validateContractObject())
                .then((res) => {
                    should(res).be.undefined();
                    should(validateType.validateTypeNoThrow.calledOnce).be.true();
                    should(validateContract.validateContractObjectNoThrow.calledOnce).be.true();
                });
        });

        it('should throw if validate type returns an error,', () => {
            const validateTypeNoThrowResponse = new StatusCodeErrorItem(InvalidType, 'validateTypeNoThrow stubbed');
            sandbox.stub(validateType, 'validateTypeNoThrow').callsFake(() => {
                console.log(`validateTypeNoThrow stubbed - returning ${validateTypeNoThrowResponse}`);
                return validateTypeNoThrowResponse;
            });

            return Promise.resolve()
                .then(() => validateContract.validateContractObject())
                .then(() => {
                    throw new Error('should fail');
                })
                .catch((err) => {
                    should(err).be.instanceOf(StatusCodeError);
                    should(err).have.property('statusCode', 400);
                    should(err).have.property('items').of.length(1);
                    should(err.items[0]).be.instanceOf(StatusCodeErrorItem);
                    should(err.items[0]).be.eql(validateTypeNoThrowResponse);
                    should(validateType.validateTypeNoThrow.calledOnce).be.true();
                });
        });

        it('should throw if validateContractObjectNoThrow return any items', () => {
            const validateContractObjectNoThrowResponse = [new StatusCodeErrorItem(InvalidType, 'validateContractObjectNoThrow stubbed')];
            sandbox.stub(validateType, 'validateTypeNoThrow').callsFake(() => {
                const response = undefined;
                console.log(`validateTypeNoThrow stubbed - returning ${response}`);
                return undefined;
            });
            sandbox.stub(validateContract, 'validateContractObjectNoThrow').callsFake(() => {
                console.log(`validateContractObjectNoThrow stubbed - returning ${validateContractObjectNoThrowResponse}`);
                return validateContractObjectNoThrowResponse;
            });

            return Promise.resolve()
                .then(() => validateContract.validateContractObject())
                .then(() => {
                    throw new Error('should fail');
                })
                .catch((err) => {
                    should(err).be.instanceOf(StatusCodeError);
                    should(err).have.property('statusCode', 400);
                    should(err).have.property('items').of.length(1);
                    should(err.items[0]).be.instanceOf(StatusCodeErrorItem);
                    should(err.items).be.eql(validateContractObjectNoThrowResponse);
                    should(validateType.validateTypeNoThrow.calledOnce).be.true();
                    should(validateContract.validateContractObjectNoThrow.calledOnce).be.true();
                });
        });
    });
});
