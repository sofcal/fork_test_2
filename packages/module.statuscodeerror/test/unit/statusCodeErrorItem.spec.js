const StatusCodeErrorItem = require('../../lib/StatusCodeErrorItem');
const should = require('should');

describe('@sage/bc-statuscodeerror.StatusCodeErrorItem', function(){
    describe('constructor', () => {
        it('should create an instance of StatusCodeErrorItem', (done) => {
            const applicationCode = 'application_code';
            const message = 'message';
            const params = { value: 'params' };

            const actual = new StatusCodeErrorItem(applicationCode, message, params);

            should(actual).be.instanceof(StatusCodeErrorItem);

            should(actual.applicationCode).eql(applicationCode);
            should(actual.message).eql(message);
            should(actual.params).eql(params);

            done();
        });
    })
});
