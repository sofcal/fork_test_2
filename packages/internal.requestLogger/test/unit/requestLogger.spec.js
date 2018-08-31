const RequestLogger = require('../../lib/RequestLogger');
const should = require('should');
const sinon = require('sinon');

describe('internal-request-logger.requestLogger', function(){
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should create an instance of RequestLogger', () => {
            should(new RequestLogger()).be.an.instanceof(RequestLogger);
        });

        it('should assign properties', () => {
            should(new RequestLogger({ id: 1 }).request).eql({ id: 1 });
        });
    });

    describe('Create', () => {
        it('should create an instance of RequestLogger', () => {
            should(RequestLogger.Create()).be.an.instanceof(RequestLogger);
        });

        it('should assign properties', () => {
            should(RequestLogger.Create({ id: 1 }).request).eql({ id: 1 });
        });
    });

    describe('extend', () => {
        it('should add additional information to the default data', () => {
            const rl = new RequestLogger({ id: 1 });
            should(rl.request).eql({ id: 1 });

            rl.extend({ additional: 'additional' });

            should(rl.request).eql({ id: 1, additional: 'additional' });
        });

        it('should overwrite existing properties on the default data', () => {
            const rl = new RequestLogger({ id: 1 });
            should(rl.request).eql({ id: 1 });

            rl.extend({ id: 2 });

            should(rl.request).eql({ id: 2 });
        });
    });

    describe('debug', () => {
        // there is no console.debug, so debug writes to console.log
        it('should log to console.log', () => {
            const now = new Date();
            sandbox.useFakeTimers(now);
            sandbox.stub(console, 'log');

            const rl = new RequestLogger({ id: 1 });
            rl.debug({ value: 'debug' });

            should(console.log.callCount).eql(1);
            should(console.log.calledWithExactly({ '@timestamp': now.toISOString(), severity: 'DEBUG', id: 1, value: 'debug' }));
        });
    });

    describe('info', () => {
        // there is no console.info, so info writes to console.log
        it('should log to console.log', () => {
            const now = new Date();
            sandbox.useFakeTimers(now);
            sandbox.stub(console, 'log');

            const rl = new RequestLogger({ id: 1 });
            rl.info({ value: 'info' });

            should(console.log.callCount).eql(1);
            should(console.log.calledWithExactly({ '@timestamp': now.toISOString(), severity: 'INFO', id: 1, value: 'info' }));
        });
    });

    describe('warn', () => {
        it('should log to console.warn', () => {
            const now = new Date();
            sandbox.useFakeTimers(now);
            sandbox.stub(console, 'warn');

            const rl = new RequestLogger({ id: 1 });
            rl.warn({ value: 'warn' });

            should(console.warn.callCount).eql(1);
            should(console.warn.calledWithExactly({ '@timestamp': now.toISOString(), severity: 'WARN', id: 1, value: 'warn' }));
        });
    });

    describe('error', () => {
        it('should log to console.error', () => {
            const now = new Date();
            sandbox.useFakeTimers(now);
            sandbox.stub(console, 'error');

            const rl = new RequestLogger({ id: 1 });
            rl.error({ value: 'error' });

            should(console.error.callCount).eql(1);
            should(console.error.calledWithExactly({ '@timestamp': now.toISOString(), severity: 'ERROR', id: 1, value: 'error' }));
        });
    });
});