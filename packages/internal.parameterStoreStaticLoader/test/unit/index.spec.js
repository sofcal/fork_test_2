const index = require('../../src/index');
const ParameterStoreStaticLoader = require('../../src/ParameterStoreStaticLoader');
const should = require('should');

describe('internal.parameterStoreStaticLoader.index', function(){
    // ensures all files are evaluated for test coverage
    it('should export the correct modules', (done) => {
        should(index).eql({ ParameterStoreStaticLoader });
        done();
    });
});
