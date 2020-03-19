const index = require('../../lib/index');
const Configuration = require('../../lib/Configuration');
const should = require('should');

describe('@sage/bc-framework-parametercache.configloaders', () => {
    it('should export relevant exports', () => {
        should(index).eql(Configuration);
    });
});
