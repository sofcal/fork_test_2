const { toStatusCodeError, toStatusCodeErrorItems } = require('../../lib/index');

const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-statuscodeerror');

const jsonschema = require('jsonschema');
const should = require('should');

describe('@sage/bc-jsonschema-to-statuscodeerror.index', function(){
    class Type {
        constructor(data = {}) {
            Object.keys(data).forEach((key) => this[key] = data[key]);
        }
    }

    const str6char = '123456';

    let obj;

    beforeEach(() => {
        obj = new Type();
    });

    const print = (results) => {
        const debug = true;
        if (debug) {
            console.log(require('util').inspect(results, false, null, 1));
        }
    };

    describe('string', () => {
        it('should map to a single error to StatusCodeError', () => {
            const value = str6char;
            const schema = { id: '/String', type: 'string', pattern: '.{0.5}' };

            // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
            const results = jsonschema.validate(value, schema);
            print(results);

            const expected = StatusCodeError.Create([
                StatusCodeErrorItem.Create('InvalidProperties', 'instance: 123456', { value: '123456' })
            ], 400);
            const actual = toStatusCodeError(results, Type, value);

            should(actual).eql(expected);
        });

        describe('custom', () => {
            it('should map to a single error to StatusCodeError with custom propertyName', () => {
                const value = str6char;
                const schema = {
                    id: '/String', type: 'string', pattern: '.{0.5}',
                    custom: { propertyName: 'newPropertyName'}
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema);
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'newPropertyName: 123456', { value: '123456' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with custom paramKey', () => {
                const value = str6char;
                const schema = {
                    id: '/String', type: 'string', pattern: '.{0.5}',
                    custom: { paramKey: 'newParamKey'}
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema);
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'instance: 123456', { newParamKey: '123456' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with custom message', () => {
                const value = str6char;
                const schema = {
                    id: '/String', type: 'string', pattern: '.{0.5}',
                    custom: { message: 'newMessage'}
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema);
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'instance: newMessage', { value: '123456' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with custom value', () => {
                const value = str6char;
                const schema = {
                    id: '/String', type: 'string', pattern: '.{0.5}',
                    custom: { value: 'newValue' }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema);
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'instance: 123456', { value: 'newValue' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error when using all custom properties', () => {
                const value = str6char;
                const schema = {
                    id: '/String', type: 'string', pattern: '.{0.5}',
                    custom: { propertyName: 'newPropertyName', message: 'newMessage', paramKey: 'newParamKey', value: 'newValue' }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema);
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'newPropertyName: newMessage', { newParamKey: 'newValue' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });
        });
    });

    describe('integer', () => {
        it('should map to a single error to StatusCodeError', () => {
            const value = 11;
            const schema = { id: '/Integer', type: 'integer', maximum: 10 };

            // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
            const results = jsonschema.validate(value, schema);
            print(results);

            const expected = StatusCodeError.Create([
                StatusCodeErrorItem.Create('InvalidProperties', 'instance: 11', { value: 11 })
            ], 400);
            const actual = toStatusCodeError(results, Type, value);

            should(actual).eql(expected);
        });

        describe('custom', () => {
            it('should map to a single error to StatusCodeError with custom propertyName', () => {
                const value = 11;
                const schema = {
                    id: '/Integer', type: 'integer', maximum: 10,
                    custom: { propertyName: 'newPropertyName'}
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema);
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'newPropertyName: 11', { value: 11 })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with custom paramKey', () => {
                const value = 11;
                const schema = {
                    id: '/Integer', type: 'integer', maximum: 10,
                    custom: { paramKey: 'newParamKey'}
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema);
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'instance: 11', { newParamKey: 11 })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with custom message', () => {
                const value = 11;
                const schema = {
                    id: '/Integer', type: 'integer', maximum: 10,
                    custom: { message: 'newMessage'}
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema);
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'instance: newMessage', { value: 11 })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with custom value', () => {
                const value = 11;
                const schema = {
                    id: '/Integer', type: 'integer', maximum: 10,
                    custom: { value: 7 }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema);
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'instance: 11', { value: 7 })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error when using multiple custom properties', () => {
                const value = 11;
                const schema = {
                    id: '/Integer', type: 'integer', maximum: 10,
                    custom: { propertyName: 'newPropertyName', message: 'newMessage', paramKey: 'newParamKey', value: 8 }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema);
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'newPropertyName: newMessage', { newParamKey: 8 })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            })
        });
    });

    describe('object', () => {
        it('should map to a single error to StatusCodeError', () => {
            const value = new Type({ first: str6char });
            const schema = {
                id: '/Object', type: 'object',
                properties: { first: { type: 'string', pattern: '.{0.5}' } }
            };

            // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
            const results = jsonschema.validate(value, schema, { propertyName: Type.name });
            print(results);

            const expected = StatusCodeError.Create([
                StatusCodeErrorItem.Create('InvalidProperties', 'Type.first: 123456', { first: '123456' })
            ], 400);
            const actual = toStatusCodeError(results, Type, value);

            should(actual).eql(expected);
        });

        it('should map to a single error to StatusCodeError when type is required (undefined)', () => {
            const value = new Type({ first: undefined });
            const schema = {
                id: '/Object', type: 'object',
                properties: { first: { type: 'string', pattern: '.{0.5}' } },
                required: ['first']
            };

            // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
            const results = jsonschema.validate(value, schema, { propertyName: Type.name });
            print(results);

            const expected = StatusCodeError.Create([
                StatusCodeErrorItem.Create('InvalidProperties', 'Type.first: undefined', { first: undefined })
            ], 400);
            const actual = toStatusCodeError(results, Type, value);

            should(actual).eql(expected);
        });

        it('should map to a single error to StatusCodeError when type is required (null)', () => {
            const value = new Type({ first: null });
            const schema = {
                id: '/Object', type: 'object',
                properties: { first: { type: 'string', pattern: '.{0.5}' } },
                required: ['first']
            };

            // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
            const results = jsonschema.validate(value, schema, { propertyName: Type.name });
            print(results);

            const expected = StatusCodeError.Create([
                StatusCodeErrorItem.Create('InvalidProperties', 'Type.first: null', { first: null })
            ], 400);
            const actual = toStatusCodeError(results, Type, value);

            should(actual).eql(expected);
        });

        it('should map multiple errors to StatusCodeError', () => {
            const value = new Type({ first: undefined, second: {} });
            const schema = {
                id: '/Object', type: 'object',
                properties: { first: { type: 'string', pattern: '.{0.5}' }, second: { type: 'array' } },
                required: ['first', 'second']
            };

            // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
            const results = jsonschema.validate(value, schema, { propertyName: Type.name });
            print(results);

            const expected = StatusCodeError.Create([
                StatusCodeErrorItem.Create('InvalidProperties', 'Type.second: [object Object]', { second: {} }),
                StatusCodeErrorItem.Create('InvalidProperties', 'Type.first: undefined', { first: undefined })
            ], 400);
            const actual = toStatusCodeError(results, Type, value);

            should(actual).eql(expected);
        });

        describe('custom', () => {
            it('should map to a single error to StatusCodeError with custom propertyName', () => {
                const value = new Type({ first: str6char });
                const schema = {
                    id: '/Object', type: 'object',
                    properties: {
                        first: {
                            type: 'string', pattern: '.{0.5}',
                            custom: { propertyName: 'newPropertyName' }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'newPropertyName: 123456', { first: '123456' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with custom paramKey', () => {
                const value = new Type({ first: str6char });
                const schema = {
                    id: '/Object', type: 'object',
                    properties: {
                        first: {
                            type: 'string', pattern: '.{0.5}',
                            custom: { paramKey: 'newParamKey' }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'Type.first: 123456', { newParamKey: '123456' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with custom message', () => {
                const value = new Type({ first: str6char });
                const schema = {
                    id: '/Object', type: 'object',
                    properties: {
                        first: {
                            type: 'string', pattern: '.{0.5}',
                            custom: { message: 'newMessage' }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'Type.first: newMessage', { first: '123456' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with custom value', () => {
                const value = new Type({ first: str6char });
                const schema = {
                    id: '/Object', type: 'object',
                    properties: {
                        first: {
                            type: 'string', pattern: '.{0.5}',
                            custom: { value: 'newValue' }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'Type.first: 123456', { first: 'newValue' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with multiple custom properties', () => {
                const value = new Type({ first: str6char });
                const schema = {
                    id: '/Object', type: 'object',
                    properties: {
                        first: {
                            type: 'string', pattern: '.{0.5}',
                            custom: { propertyName: 'newPropertyName', paramKey: 'newParamKey', message: 'newMessage', value: 'newValue' }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'newPropertyName: newMessage', { newParamKey: 'newValue' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });
        });
    });

    describe('nested object', () => {
        it('should map to a single error to StatusCodeError', () => {
            const value = new Type({ nested: { first : str6char } });
            const schema = {
                id: '/Object', type: 'object',
                properties: {
                    nested: {
                        type: 'object',
                        properties: { first: { type: 'string', pattern: '.{0.5}' } },
                        required: ['first']
                    }
                }
            };

            // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
            const results = jsonschema.validate(value, schema, { propertyName: Type.name });
            print(results);

            const expected = StatusCodeError.Create([
                StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested.first: 123456', { 'nested.first': '123456' })
            ], 400);
            const actual = toStatusCodeError(results, Type, value);

            should(actual).eql(expected);
        });

        it('should map to a single error to StatusCodeError when type is required', () => {
            const value = new Type({ nested: { first : undefined } });
            const schema = {
                id: '/Object', type: 'object',
                properties: {
                    nested: {
                        type: 'object',
                        properties: { first: { type: 'string', pattern: '.{0.5}' } },
                        required: ['first']
                    }
                }
            };

            // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
            const results = jsonschema.validate(value, schema, { propertyName: Type.name });
            print(results);

            const expected = StatusCodeError.Create([
                StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested.first: undefined', { 'nested.first': undefined })
            ], 400);
            const actual = toStatusCodeError(results, Type, value);

            should(actual).eql(expected);
        });

        it('should map multiple errors to StatusCodeError', () => {
            const value = new Type({ nested: { first: undefined, second: {} } });
            const schema = {
                id: '/Object', type: 'object',
                properties: {
                    nested: {
                        type: 'object',
                        properties: { first: { type: 'string', pattern: '.{0.5}' }, second: { type: 'array' } },
                        required: ['first', 'second']
                    }
                }
            };

            // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
            const results = jsonschema.validate(value, schema, { propertyName: Type.name });
            print(results);

            const expected = StatusCodeError.Create([
                StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested.second: [object Object]', { 'nested.second': {} }),
                StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested.first: undefined', { 'nested.first': undefined })
            ], 400);
            const actual = toStatusCodeError(results, Type, value);

            should(actual).eql(expected);
        });

        describe('custom', () => {
            it('should map to a single error to StatusCodeError with custom propertyName', () => {
                const value = new Type({ nested: { first : str6char } });
                const schema = {
                    id: '/Object',
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'object',
                            properties: { first: { type: 'string', pattern: '.{0.5}' } },
                            required: ['first'],
                            custom: {
                                item: { propertyName: 'newPropertyName' }
                            }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'newPropertyName: 123456', { 'nested.first': '123456' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with custom paramKey', () => {
                const value = new Type({ nested: { first : str6char } });
                const schema = {
                    id: '/Object',
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'object',
                            properties: { first: { type: 'string', pattern: '.{0.5}' } },
                            required: ['first'],
                            custom: {
                                item: { paramKey: 'newParamKey' }
                            }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested.first: 123456', { newParamKey: '123456' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with custom message', () => {
                const value = new Type({ nested: { first : str6char } });
                const schema = {
                    id: '/Object',
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'object',
                            properties: { first: { type: 'string', pattern: '.{0.5}' } },
                            required: ['first'],
                            custom: {
                                item: { message: 'newMessage' }
                            }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested.first: newMessage', { 'nested.first': '123456' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with custom value', () => {
                const value = new Type({ nested: { first : str6char } });
                const schema = {
                    id: '/Object',
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'object',
                            properties: { first: { type: 'string', pattern: '.{0.5}' } },
                            required: ['first'],
                            custom: {
                                item: { value: 'newValue' }
                            }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested.first: 123456', { 'nested.first': 'newValue' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with multiple custom properties', () => {
                const value = new Type({ nested: { first : str6char } });
                const schema = {
                    id: '/Object',
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'object',
                            properties: { first: { type: 'string', pattern: '.{0.5}' } },
                            required: ['first'],
                            custom: {
                                item: { propertyName: 'newPropertyName', paramKey: 'newParamKey', message: 'newMessage', value: 'newValue' }
                            }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'newPropertyName: newMessage', { newParamKey: 'newValue' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should use the value from the parent property if specified', () => {
                const value = new Type({ nested: { first : str6char } });
                const schema = {
                    id: '/Object',
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'object',
                            properties: { first: { type: 'string', pattern: '.{0.5}' } },
                            required: ['first'],
                            custom: {
                                item: { useParent: 2 }
                            }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested: [object Object]', { 'nested.first': {first: '123456' } })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should stringify the value if specified', () => {
                const value = new Type({ nested: { first : str6char } });
                const schema = {
                    id: '/Object',
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'object',
                            properties: { first: { type: 'string', pattern: '.{0.5}' } },
                            required: ['first'],
                            custom: {
                                item: { useParent: 2, stringify: true }
                            }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested: {"first":"123456"}', { 'nested.first': {first: '123456' } })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should take mappings from the custom field if no custom.item field is provided', () => {
                const value = new Type({ nested: { first : str6char } });
                const schema = {
                    id: '/Object',
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'object',
                            properties: { first: { type: 'string', pattern: '.{0.5}' } },
                            required: ['first'],
                            custom: { propertyName: 'newPropertyName', paramKey: 'newParamKey', message: 'newMessage', value: 'newValue' }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'newPropertyName: newMessage', { newParamKey: 'newValue' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });
        });
    });

    describe('arrays', () => {
        it('should map errors from fields inside array objects', () => {
            const value = new Type({ nested: [{ field1: 'incorrect', field2: 'valid' }] });
            const schema = {
                id: '/Object',
                type: 'object',
                properties: {
                    nested: {
                        type: 'array',
                        items: {
                            oneOf: [{
                                properties: {
                                    field1: { enum: ['field1_value1'] },
                                    field2: { type: 'string', pattern: '^valid|also_valid' }
                                },
                                required: ['field1', 'field2']
                            }, {
                                properties: {
                                    field1: { enum: ['field1_value2'] },
                                    field2: { type: 'string', pattern: 'valid|also_valid' },
                                },
                                required: ['field1', 'field2'],
                            }]
                        }
                    }
                }
            };

            // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
            const results = jsonschema.validate(value, schema, { propertyName: Type.name });
            print(results);

            const expected = StatusCodeError.Create([
                StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested[0]: [object Object]', { 'nested[0]': { field1: 'incorrect', field2: 'valid' } })
            ], 400);
            const actual = toStatusCodeError(results, Type, value);

            should(actual).eql(expected);
        });

        it('should map to a single error to StatusCodeError when type is required', () => {
            const value = new Type({ nested: [{ field1: null, field2: 'valid' }] });
            const schema = {
                id: '/Object',
                type: 'object',
                properties: {
                    nested: {
                        type: 'array',
                        items: {
                            oneOf: [{
                                properties: {
                                    field1: { enum: ['field1_value1'] },
                                    field2: { type: 'string', pattern: '^valid|also_valid' }
                                },
                                required: ['field1', 'field2']
                            }, {
                                properties: {
                                    field1: { enum: ['field1_value2'] },
                                    field2: { type: 'string', pattern: 'valid|also_valid' },
                                },
                                required: ['field1', 'field2'],
                            }]
                        }
                    }
                }
            };

            // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
            const results = jsonschema.validate(value, schema, { propertyName: Type.name });
            print(results);

            const expected = StatusCodeError.Create([
                StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested[0]: [object Object]', { 'nested[0]': { field1: null, field2: 'valid' } })
            ], 400);
            const actual = toStatusCodeError(results, Type, value);

            should(actual).eql(expected);
        });

        describe('custom', () => {
            it('should map to a single error to StatusCodeError with custom propertyName', () => {
                const value = new Type({ nested: [{ field1: 'incorrect', field2: 'valid' }] });
                const schema = {
                    id: '/Object',
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'array',
                            custom: {
                                items: { propertyName: 'newPropertyName' }
                            },
                            items: {
                                oneOf: [{
                                    properties: {
                                        field1: { enum: ['field1_value1'] },
                                        field2: { type: 'string', pattern: '^valid|also_valid' }
                                    },
                                    required: ['field1', 'field2']
                                }, {
                                    properties: {
                                        field1: { enum: ['field1_value2'] },
                                        field2: { type: 'string', pattern: 'valid|also_valid' },
                                    },
                                    required: ['field1', 'field2'],
                                }]
                            }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'newPropertyName: [object Object]', { 'nested[0]': { field1: 'incorrect', field2: 'valid' } })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with custom paramKey', () => {
                const value = new Type({ nested: [{ field1: 'incorrect', field2: 'valid' }] });
                const schema = {
                    id: '/Object',
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'array',
                            custom: {
                                items: { paramKey: 'newParamKey' }
                            },
                            items: {
                                oneOf: [{
                                    properties: {
                                        field1: { enum: ['field1_value1'] },
                                        field2: { type: 'string', pattern: '^valid|also_valid' }
                                    },
                                    required: ['field1', 'field2']
                                }, {
                                    properties: {
                                        field1: { enum: ['field1_value2'] },
                                        field2: { type: 'string', pattern: 'valid|also_valid' },
                                    },
                                    required: ['field1', 'field2'],
                                }]
                            }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested[0]: [object Object]', { 'newParamKey': { field1: 'incorrect', field2: 'valid' } })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with custom message', () => {
                const value = new Type({ nested: [{ field1: 'incorrect', field2: 'valid' }] });
                const schema = {
                    id: '/Object',
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'array',
                            custom: {
                                items: { message: 'newMessage' }
                            },
                            items: {
                                oneOf: [{
                                    properties: {
                                        field1: { enum: ['field1_value1'] },
                                        field2: { type: 'string', pattern: '^valid|also_valid' }
                                    },
                                    required: ['field1', 'field2']
                                }, {
                                    properties: {
                                        field1: { enum: ['field1_value2'] },
                                        field2: { type: 'string', pattern: 'valid|also_valid' },
                                    },
                                    required: ['field1', 'field2'],
                                }]
                            }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested[0]: newMessage', { 'nested[0]': { field1: 'incorrect', field2: 'valid' } })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with custom value', () => {
                const value = new Type({ nested: [{ field1: 'incorrect', field2: 'valid' }] });
                const schema = {
                    id: '/Object',
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'array',
                            custom: {
                                items: { value: 'newValue' }
                            },
                            items: {
                                oneOf: [{
                                    properties: {
                                        field1: { enum: ['field1_value1'] },
                                        field2: { type: 'string', pattern: '^valid|also_valid' }
                                    },
                                    required: ['field1', 'field2']
                                }, {
                                    properties: {
                                        field1: { enum: ['field1_value2'] },
                                        field2: { type: 'string', pattern: 'valid|also_valid' },
                                    },
                                    required: ['field1', 'field2'],
                                }]
                            }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested[0]: [object Object]', { 'nested[0]': 'newValue' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should map to a single error to StatusCodeError with multiple custom properties', () => {
                const value = new Type({ nested: [{ field1: 'incorrect', field2: 'valid' }] });
                const schema = {
                    id: '/Object',
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'array',
                            custom: {
                                items: {
                                    propertyName: 'newPropertyName',
                                    paramKey: 'newParamKey',
                                    message: 'newMessage',
                                    value: 'newValue'
                                }
                            },
                            items: {
                                oneOf: [{
                                    properties: {
                                        field1: { enum: ['field1_value1'] },
                                        field2: { type: 'string', pattern: '^valid|also_valid' }
                                    },
                                    required: ['field1', 'field2']
                                }, {
                                    properties: {
                                        field1: { enum: ['field1_value2'] },
                                        field2: { type: 'string', pattern: 'valid|also_valid' },
                                    },
                                    required: ['field1', 'field2'],
                                }]
                            }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'newPropertyName: newMessage', { 'newParamKey': 'newValue' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should stringify the value if specified', () => {
                const value = new Type({ nested: [{ field1: 'incorrect', field2: 'valid' }] });
                const schema = {
                    id: '/Object',
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'array',
                            custom: {
                                items: {
                                    stringify: true
                                }
                            },
                            items: {
                                oneOf: [{
                                    properties: {
                                        field1: { enum: ['field1_value1'] },
                                        field2: { type: 'string', pattern: '^valid|also_valid' }
                                    },
                                    required: ['field1', 'field2']
                                }, {
                                    properties: {
                                        field1: { enum: ['field1_value2'] },
                                        field2: { type: 'string', pattern: 'valid|also_valid' },
                                    },
                                    required: ['field1', 'field2'],
                                }]
                            }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested[0]: {\"field1\":\"incorrect\",\"field2\":\"valid\"}', { 'nested[0]': { field1: 'incorrect', field2: 'valid' } })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });

            it('should take mappings from the custom field if no custom.items field is provided', () => {
                const value = new Type({ nested: [{ field1: 'incorrect', field2: 'valid' }] });
                const schema = {
                    id: '/Object',
                    type: 'object',
                    properties: {
                        nested: {
                            type: 'array',
                            custom: {
                                propertyName: 'newPropertyName',
                                paramKey: 'newParamKey',
                                message: 'newMessage',
                                value: 'newValue'
                            },
                            items: {
                                oneOf: [{
                                    properties: {
                                        field1: { enum: ['field1_value1'] },
                                        field2: { type: 'string', pattern: '^valid|also_valid' }
                                    },
                                    required: ['field1', 'field2']
                                }, {
                                    properties: {
                                        field1: { enum: ['field1_value2'] },
                                        field2: { type: 'string', pattern: 'valid|also_valid' },
                                    },
                                    required: ['field1', 'field2'],
                                }]
                            }
                        }
                    }
                };

                // generate a real result from jsonschema, so we can ensure we're always shipping a compatible version
                const results = jsonschema.validate(value, schema, { propertyName: Type.name });
                print(results);

                const expected = StatusCodeError.Create([
                    StatusCodeErrorItem.Create('InvalidProperties', 'newPropertyName: newMessage', { 'newParamKey': 'newValue' })
                ], 400);
                const actual = toStatusCodeError(results, Type, value);

                should(actual).eql(expected);
            });
        });
    });
});
