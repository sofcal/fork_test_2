const { StatusCodeError, StatusCodeErrorItem } = require('../../lib');
const should = require('should');

describe('@sage/bc-statuscodeerror.StatusCodeError', function(){
    describe('constructor', () => {
        it('should create an instance of StatusCodeError', (done) => {
            const statusCode = 500;
            const items = [{
                message: 'message1',
                params: {value: 'params1'}
            }, {
                message: 'message2',
                params: {value: 'params2'}
            }];

            const actual = new StatusCodeError(items, statusCode);

            should(actual).be.instanceof(StatusCodeError);

            should(actual.statusCode).eql(statusCode);
            should(actual.items).eql(items);
            should.exist(actual.stack);

            done();
        });

        it('should use the passed in stack', (done) => {
            const statusCode = 500;
            const items = [{
                message: 'message1',
                params: {value: 'params1'}
            }, {
                message: 'message2',
                params: {value: 'params2'}
            }];

            const actual = new StatusCodeError(items, statusCode, { value: 'stack' });

            should(actual).be.instanceof(StatusCodeError);

            should(actual.statusCode).eql(statusCode);
            should(actual.items).eql(items);
            should(actual.stack).eql({ value: 'stack' });

            done();
        });
    });

    describe('CreateFromSpecs', () => {
        it('should create an instance of StatusCodeError', (done) => {
            const statusCode = 500;
            const specs = [{
                applicationCode: 'code1',
                message: 'message1',
                params: { value: 'params1' }
            }, {
                applicationCode: 'code2',
                message: 'message2',
                params: { value: 'params2' }
            }];

            const actual = StatusCodeError.CreateFromSpecs(specs, statusCode);

            should(actual).be.instanceof(StatusCodeError);

            should(actual.statusCode).eql(statusCode);
            should(actual.items).eql([
                new StatusCodeErrorItem(specs[0].applicationCode, specs[0].message, specs[0].params),
                new StatusCodeErrorItem(specs[1].applicationCode, specs[1].message, specs[1].params)
            ]);
            should.exist(actual.stack);

            done();
        });

        it('should use the passed in stack', (done) => {
            const statusCode = 500;
            const specs = [{
                applicationCode: 'code1',
                message: 'message1',
                params: { value: 'params1' }
            }, {
                applicationCode: 'code2',
                message: 'message2',
                params: { value: 'params2' }
            }];

            const actual = StatusCodeError.CreateFromSpecs(specs, statusCode, { value: 'stack' });

            should(actual).be.instanceof(StatusCodeError);

            should(actual.statusCode).eql(statusCode);
            should(actual.items).eql([
                new StatusCodeErrorItem(specs[0].applicationCode, specs[0].message, specs[0].params),
                new StatusCodeErrorItem(specs[1].applicationCode, specs[1].message, specs[1].params)
            ]);
            should(actual.stack).eql({ value: 'stack' });

            done();
        });
    })
});
