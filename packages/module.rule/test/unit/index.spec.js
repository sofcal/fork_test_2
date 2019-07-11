const index = require('../../lib/index');
const Rule = require('../../lib/Rule');
const should = require('should');

describe('@sage/bc-rule.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql(Rule);
        done();
    });
});
