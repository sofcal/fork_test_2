const index = require('../../lib/index');
const Cache = require('../../lib/Cache');
const should = require('should');

describe('@sage/sfab-s2s-jwt-cache.index', function(){
    it('should export the correct modules', () => {
        should(index).eql({ Cache });
    });
});
