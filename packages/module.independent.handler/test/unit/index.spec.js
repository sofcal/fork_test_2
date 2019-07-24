const index = require('../../lib/index')
const Handler = require('../../lib/Handler');
const ErrorSpecs = require('../../lib/ErrorSpecs');
const should = require('should');

describe('@sage/bc-independent-lambda-handler.index', function(){
    it('should export the correct modules', () => {
        should(index).eql({
            Handler, ErrorSpecs
        });
    });
});
