const Handler = require('../../lib/index');
const should = require('should');
const Promise = require('bluebird');

describe('@sage/bc-default-lambda-handler.index', function(){
    // placeholder
    it('should throw if Handler instantiated directly', (done) => {
        Promise.resolve(new Handler())
            .then(() => {
                done(new Error('should have thrown'));
            })
            .catch((err) => {
                should(err.message).eql('Handler should not be instantiated. Extend Handler instead.');
                done()
            })
    });
});
