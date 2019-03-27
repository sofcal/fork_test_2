const config = require('../../../lib/validators/config');

const should = require('should');

const logger = {
    info: (msg) => console.log(msg),
    warn: (msg) => console.log(msg),
    error: (msg) => console.error(msg),
};

describe('jwt-authenticator.config', function() {
    it('Should return a function', () => {
        config.should.be.a.Function();
    });

    it('Should throw an error if no config passed in', () => {
        should.throws(() => (config(undefined, { logger })) )
    });

    it('Should throw an error if config has no cacheExpiry', () => {
        should.throws(() => (config({ serviceMappings: true }, { logger })) )
    });

    it('Should throw an error if config has no serviceMappings', () => {
        should.throws(() => (config({ cacheExpiry: true }, { logger })) )
    });

    it('Should not throw an error if valid config passed in ', () => {
        should.doesNotThrow(() => (config({ serviceMappings: true, cacheExpiry: true }, { logger })) )
    });
});