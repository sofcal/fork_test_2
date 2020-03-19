const index = require('../../lib/index');
const ParameterCache = require('../../lib/ParameterCache');
const ParameterLoaders = require('../../lib/loaders');
const mocks = require('../../lib/mocks');
const should = require('should');

describe('@sage/bc-framework-parametercache', () => {
    it('should export relevant exports', () => {
        should(index).eql({
            ParameterCache,
            ParameterLoaders,
            mocks
        });
    });
});
