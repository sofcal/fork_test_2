const index = require('../../lib/index');
const NarrativeDictionary = require('../../lib/NarrativeDictionary');
const should = require('should');

describe('internal-contracts-narrativedictionary.index', function(){
    // placeholder
    it('should export the correct modules', (done) => {
        should(index).eql({ NarrativeDictionary });
        done();
    });
});
