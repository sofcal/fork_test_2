const index = require('../../lib/index');
const should = require('should');

describe('@sage/sfab-s2s-jwt-cache.index', function(){
    it('should export the correct modules', () => {
        return index.should.have.only.keys('Cache');
    });
});
