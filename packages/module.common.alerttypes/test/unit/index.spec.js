const index = require('../../lib/index');
const AlertTypes = require('../../lib/AlertTypes');
const should = require('should');

describe('@sage/bc-common-alerttypes.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql(AlertTypes);
        done();
    });
});
