const index = require('../../lib/index');
const Kid = require('../../lib/Kid');
const should = require('should');

describe('@sage/sfab-s2s-jwt-kid.index', function(){
    describe('Generate', () => {
        it('should export the correct modules', (done) => {
            should(index).eql({ Kid });
            done();
        });
    });
});