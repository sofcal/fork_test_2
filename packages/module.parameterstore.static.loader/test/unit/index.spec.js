const index = require('../../lib/index');
const ParameterStoreStaticLoader = require('../../lib/ParameterStoreStaticLoader');
const should = require('should');

describe('@sage/bc-parameterstore-static-loader.index', function(){
    // ensures all files are evaluated for test coverage
    it('should export the correct modules', (done) => {
        should(index).eql({ ParameterStoreStaticLoader });
        done();
    });
});
