const index = require('../../lib/index');
const alertTypes = require('../../lib/alertTypes');
const should = require('should');

describe('@sage/bc-common-alerttypes.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql(alertTypes);
        done();
    });
});
