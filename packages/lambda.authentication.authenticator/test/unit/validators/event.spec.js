const event = require('../../../lib/validators/event');

const should = require('should');

describe('jwt-authenticator.event', function() {
    it('Should return a function', () => {
        event.should.be.a.Function();
    });

    it('Should throw an error if event has no authorizationToken', () => {
        should.throws(() => (event({  })) )
    });

    it('Should not throw an error if valid event passed in ', () => {
        should.doesNotThrow(() => (event({ authorizationToken: true })) )
    });
});