const index = require('../../src/index');
const should = require('should');

describe('@sage/bc-data-cache.index', function(){
    it('should export the correct modules', () => {
        return index.should.have.only.keys('Cache');
    });
});
