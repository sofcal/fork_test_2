const { toStatusCodeError, toStatusCodeErrorItems } = require('../../lib/index');
const { StatusCodeError, StatusCodeErrorItem } = require('internal-status-code-error');
const should = require('should');

describe('internal-jsonschema-to-statuscodeerror.index', function(){
    class Type { }

    let obj;

    beforeEach(() => {
        obj = new Type();
    });

    it('should map to a single error to StatusCodeError', () => {
        obj.first = undefined;

        const result = {
            instance: { first: null },
            schema: {
                id: '/Type',
                type: 'object',
                required: true,
                properties: { first: { type: 'object', required: true } }
            },
            propertyPath: 'Type',
            errors: [{
                property: 'Type.first',
                message: 'is not of a type(s) object',
                schema: { type: 'object', required: true },
                name: 'type',
                argument: [ 'object' ],
                stack: 'Type.first is not of a type(s) object'
            }],
            throwError: false,
            disableFormat: false
        };

        const expected = StatusCodeError.Create([
            StatusCodeErrorItem.Create('InvalidProperties', 'Type.first: undefined', { first: undefined })
        ], 400);
        const actual = toStatusCodeError(result, Type, obj);

        should(actual).eql(expected);
    });

    it('should map multiple errors to StatusCodeError', () => {
        obj.first = undefined;
        obj.second = {};

        const result = {
            instance: { first: null },
            schema: {
                id: '/Type',
                type: 'object',
                required: true,
                properties: { first: { type: 'object', required: true } }
            },
            propertyPath: 'Type',
            errors: [{
                property: 'Type.first',
                message: 'is not of a type(s) object',
                schema: { type: 'object', required: true },
                name: 'type',
                argument: [ 'object' ],
                stack: 'Type.first is not of a type(s) object'
            }, {
                property: 'Type.second',
                message: 'is not of a type(s) array',
                schema: { type: 'array', required: true },
                name: 'type',
                argument: [ 'array' ],
                stack: 'Type.second is not of a type(s) array'
            }],
            throwError: false,
            disableFormat: false
        };

        const expected = StatusCodeError.Create([
            StatusCodeErrorItem.Create('InvalidProperties', 'Type.first: undefined', { first: undefined }),
            StatusCodeErrorItem.Create('InvalidProperties', 'Type.second: [object Object]', { second: {} })
        ], 400);
        const actual = toStatusCodeError(result, Type, obj);

        should(actual).eql(expected);
    });

    it('should map errors from array objects', () => {
        const result = {
            instance: {
                nested: [ { field1: null, field2: 'valid' }],
            },
            schema: {
                id: '/Type',
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
                    },
                },
                required: ['nested']
            },
            propertyPath: 'Type',
            errors: [{
                property: 'Type.nested[0]',
                message: 'is not exactly one from [subschema 0],[subschema 1]',
                schema: {
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
                },
                instance: { field1: null, field2: 'valid' },
                name: 'oneOf',
                argument: ['[subschema 0]', '[subschema 1]'],
                stack: 'Type.nested[0] is not exactly one from [subschema 0],[subschema 1]'
            }],
            throwError: undefined,
            disableFormat: false
        };

        obj.nested = [{ field1: null, field2: 'valid' }];

        const expected = StatusCodeError.Create([
            StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested: [object Object]', { 'nested': { field1: null, field2: 'valid' } })
        ], 400);
        const actual = toStatusCodeError(result, Type, obj);

        should(actual).eql(expected);
    });

    it('should map errors from fields inside array objects', () => {
        const result = {
            instance: {
                nested: [ { field1: null, field2: 'valid' }],
            },
            schema: {
                id: '/Type',
                type: 'object',
                properties: {
                    nested: {
                        type: 'array',
                        items: {
                            properties: {
                                field1: { type: 'number' },
                                field2: { type: 'string', pattern: '^valid|also_valid' }
                            },
                            required: ['field1', 'field2']
                        }
                    },
                },
                required: ['nested']
            },
            propertyPath: 'Type',
            errors: [{
                property: 'Type.nested[0].field1',
                message: 'is not of a type(s) number',
                schema: { type: 'number', minimum: 0 },
                name: 'type',
                argument: [ 'number' ],
                stack: 'Type.nested[0].field1 is not of a type(s) number'
            }],
            throwError: undefined,
            disableFormat: false
        };

        obj.nested = [{ field1: 'incorrect', field2: 'valid' }];

        const expected = StatusCodeError.Create([
            StatusCodeErrorItem.Create('InvalidProperties', 'Type.nested: [object Object]', { 'nested': { field1: 'incorrect', field2: 'valid' } })
        ], 400);
        const actual = toStatusCodeError(result, Type, obj);

        should(actual).eql(expected);
    })
});
