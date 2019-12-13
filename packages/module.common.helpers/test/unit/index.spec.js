const index = require('../../lib/index');
const helpersWrapper = require('../../lib/helpers');
const should = require('should');

describe('@sage/bc-common-helpers.index', () => {
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql(helpersWrapper);
        done();
    });
});
