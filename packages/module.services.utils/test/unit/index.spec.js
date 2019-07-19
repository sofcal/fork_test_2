const index = require('../../lib/index');
const servicesUtils = require('../../lib/utils');
const should = require('should');

describe('@sage/bc-services-utils.index', () => {
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql(servicesUtils);
        done();
    });
});
