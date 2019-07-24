const Cache = require('../../lib/Cache');
const { logger: loggerGen } = require('@sage/bc-debug-utils');
const Promise = require('bluebird');
const should = require('should');
const sinon = require('sinon');

describe('@sage/sfab-s2s-jwt-cache.Cache', function(){
    const logger = loggerGen(true);
    const sandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
    });
        
    it('should export the correct modules', () => {
        should.equal(typeof Cache, 'function');
    });

    describe('Create', () => {
        const cacheExpiry = 100;
        const refreshFunction = () => 'test';

        it('should be able to create new cache object', () => {
            const uut = Cache.Create({cacheExpiry, refreshFunction}, { logger });

            should(uut).be.Object();
            should(uut).be.instanceof(Cache);
        });
    });

    describe('constructor', () => {
        const cacheExpiry = 100;
        const refreshFunction = () => 'test';

        it('should be able to create new cache object', () => {
            const uut = new Cache({cacheExpiry, refreshFunction}, { logger });

            should(uut).be.Object();
            should(uut).be.instanceof(Cache);
        });
    
        it('should create cache object with correct properties', () => {
            const uut = new Cache({cacheExpiry, refreshFunction}, { logger });
    
            should(uut.cacheExpiry).eql(cacheExpiry);
            should(uut.refreshFunction).eql(refreshFunction);
            should(uut.data).eql({});
        });

        it('should throw when refresh function invalid or missing', () => {
            should(
                () => new Cache({ cacheExpiry, refreshFunction: 'refreshFunction' }, { logger })
            ).throw(new Error('Invalid argument passed: Refresh function is not a function'));
            should(
                () => new Cache({ cacheExpiry }, { logger })
            ).throw('Invalid argument passed: Refresh function is not a function')
        });

        it('should throw when cacheExpiry invalid or missing', () => {
            should(
                () => new Cache({ cacheExpiry: 'cacheExpiry', refreshFunction }, { logger })
            ).throw(new Error('Invalid argument passed: CacheExpiry not a number'));
            should(
                () => new Cache({ refreshFunction }, { logger })
            ).throw(new Error('Invalid argument passed: CacheExpiry not a number'));
        });

        it('should throw when logger invalid', () => {
            const noop = () => {};
            should(
                () => new Cache({ cacheExpiry, refreshFunction }, { logger: 'logger'})
            ).throw(new Error('Invalid argument passed: Logger not valid'));
            should(
                () => new Cache({ cacheExpiry, refreshFunction }, { logger: {info: noop} })
            ).throw(new Error('Invalid argument passed: Logger not valid'));
            should(
                () => new Cache({ cacheExpiry, refreshFunction }, { logger: {error: noop} })
            ).throw(new Error('Invalid argument passed: Logger not valid'));
        });

        it('should default logger when not passed in', () => {
            const uut = new Cache({cacheExpiry, refreshFunction});
    
            should(uut.logger).be.a.Object();
            should(uut.logger).have.properties(['info', 'warn', 'error']);
            should(uut.logger.error()).eql(undefined);
        });
    });

    describe('cacheExpired ', () => {
        const cacheExpiry = 50;
        const refreshFunction = () => 'test';

        beforeEach(() => {
            sandbox.useFakeTimers(100000);
        });

        it('should return false if non-expiring', () => {
            const uut = new Cache({ cacheExpiry: -1, refreshFunction }, { logger });
            uut.refreshTime = 0;

            should(uut.cacheExpired()).eql(false);
        });

        it('should return true if cache expired', () => {
            const uut = new Cache({cacheExpiry, refreshFunction}, { logger });
            uut.refreshTime = 0;

            should(uut.cacheExpired()).eql(true);
        });

        it('should return false if cache still valid', () => {
            const uut = new Cache({cacheExpiry, refreshFunction}, { logger });
            uut.refreshTime = 100;

            should(uut.cacheExpired()).eql(false);
        });

        it('should return false if cache still valid (boundary)', () => {
            const uut = new Cache({cacheExpiry, refreshFunction}, { logger });
            uut.refreshTime = 50;

            should(uut.cacheExpired()).eql(false);
        });
    });

    describe('getData ', () => {
        const cacheExpiry = 50;
        let clock;

        beforeEach(() => {
            clock = sandbox.useFakeTimers();
        });

        it('should return a promise', () => {
            const refreshFunction = sandbox.stub();
            const uut = new Cache({cacheExpiry, refreshFunction}, { logger });

            should(uut.getData()).be.Promise();
        });

        it('should await the current refresh if one is in progress', () => {
            const data = { value: 'refreshInProgress' };
            const refreshFunction = sandbox.stub();
            const uut = new Cache({cacheExpiry, refreshFunction}, { logger });
            uut.currentRefresh = Promise.resolve(undefined).then(() => uut.data = data);

            return uut.getData()
                .then((actual) => {
                    should(actual).eql({ value: 'refreshInProgress' });

                    should(refreshFunction.callCount).eql(0);
                })
        });

        it('should not refresh if the cache has not expired and forceRefresh is false', () => {
            const data = { value: 'default' };
            const refreshFunction = sandbox.stub();
            const uut = new Cache({ cacheExpiry, refreshFunction }, { logger });

            uut.data = data;

            return uut.getData(false)
                .then((actual) => {
                    should(actual).eql({ value: 'default' });

                    should(refreshFunction.callCount).eql(0);
                });
        });

        it('should not refresh if the cache has not expired and forceRefresh is false (boundary)', () => {
            const data = { value: 'default' };
            const refreshFunction = sandbox.stub();
            const uut = new Cache({ cacheExpiry, refreshFunction }, { logger });

            uut.data = data;
            clock.tick(50999); // tick to the edge of our expiry (50.999 seconds)

            return uut.getData(false)
                .then((actual) => {
                    should(actual).eql({ value: 'default' });

                    should(refreshFunction.callCount).eql(0);
                });
        });

        it('should refresh if the cache has not expired, but forceRefresh is true' , () => {
            const data = { value: 'default' };
            const refreshData = { value: 'refreshed' };
            const refreshFunction = sandbox.stub();
            refreshFunction.resolves(refreshData);

            const uut = new Cache({ cacheExpiry, refreshFunction }, { logger });
            uut.data = data;

            return uut.getData(true)
                .then((actual) => {
                    should(actual).eql({ value: 'refreshed' });

                    should(refreshFunction.callCount).eql(1);
                });
        });

        it('should refresh if the cache has expired', () => {
            const data = { value: 'default' };
            const refreshData = { value: 'refreshed' };
            const refreshFunction = sandbox.stub();
            refreshFunction.resolves(refreshData);

            const uut = new Cache({ cacheExpiry, refreshFunction }, { logger });
            uut.data = data;

            clock.tick(51000); // tick past our cache expiry

            return uut.getData(false)
                .then((actual) => {
                    should(actual).eql({ value: 'refreshed' });

                    should(refreshFunction.callCount).eql(1);
                });
        });

        it('should throw if the refreshFunction throws', () => {
            const data = { value: 'default' };
            const expected = new Error('error_refresh');
            const refreshFunction = sandbox.stub();
            refreshFunction.callsFake(() => Promise.reject(expected));

            const uut = new Cache({ cacheExpiry, refreshFunction }, { logger });
            uut.data = data;

            clock.tick(51000); // tick past our cache expiry

            should(uut.getData(false)).be.rejectedWith(expected);
        });

        it('should set the refreshTime on a successful refresh', () => {
            const data = { value: 'default' };
            const refreshData = { value: 'refreshed' };
            const refreshFunction = sandbox.stub();
            refreshFunction.resolves(refreshData);

            const uut = new Cache({ cacheExpiry, refreshFunction }, { logger });
            uut.data = data;

            clock.tick(51000); // tick past our cache expiry

            should(uut.refreshTime).eql(0);
            return uut.getData(false)
                .then(() => {
                    should(uut.refreshTime).eql(51);
                });
        });

        it('should reset currentRefresh on a successful refresh', () => {
            const data = { value: 'default' };
            const refreshData = { value: 'refreshed' };
            const refreshFunction = sandbox.stub();
            refreshFunction.resolves(refreshData);

            const uut = new Cache({ cacheExpiry, refreshFunction }, { logger });
            uut.data = data;

            clock.tick(51000); // tick past our cache expiry

            return uut.getData(false)
                .then(() => {
                    should(uut.currentRefresh).eql(null);
                });
        });

        it('should not set the refreshTime on a failed refresh', (done) => {
            const data = { value: 'default' };
            const expected = new Error('error_refresh');
            const refreshFunction = sandbox.stub();
            refreshFunction.callsFake(() => Promise.reject(expected));

            const uut = new Cache({ cacheExpiry, refreshFunction }, { logger });
            uut.data = data;

            clock.tick(51000); // tick past our cache expiry

            should(uut.refreshTime).eql(0);

            // deliberately not returned as we're using the done callback
            uut.getData(false)
                .then(() => {
                    done(new Error('should have thrown'));
                })
                .catch(() => {
                    should(uut.refreshTime).eql(0);
                    done();
                })
                .catch((err) => done(err instanceof Error ? err : new Error(err)))
        });

        it('should reset currentRefresh on a failed refresh', (done) => {
            const data = { value: 'default' };
            const expected = new Error('error_refresh');
            const refreshFunction = sandbox.stub();
            refreshFunction.callsFake(() => Promise.reject(expected));

            const uut = new Cache({ cacheExpiry, refreshFunction }, { logger });
            uut.data = data;

            clock.tick(51000); // tick past our cache expiry

            // deliberately not returned as we're using the done callback
            uut.getData(false)
                .then(() => {
                    done(new Error('should have thrown'));
                })
                .catch(() => {
                    should(uut.currentRefresh).eql(null);
                    done();
                })
                .catch((err) => done(err instanceof Error ? err : new Error(err)))
        });
    });

    describe('buildCache ', () => {
        const cacheExpiry = 50;

        const data = { test: true };

        const refreshFunction = () => data;

        beforeEach(() => {
            sandbox.useFakeTimers(100 * 1000);
        });

        it('should return a promise', () => {
            const uut = new Cache({ cacheExpiry, refreshFunction }, { logger });
            sandbox.stub(uut, 'fetch').resolves(data);

            should(uut.buildCache()).be.Promise();
        });

        it('should reject promise if fetch throws any errors', () => {
            const uut = new Cache({ cacheExpiry, refreshFunction }, { logger });
            sandbox.stub(uut, 'fetch').callsFake(() => Promise.reject(new Error('reject')));

            should(uut.buildCache()).be.rejectedWith(new Error('reject'));
        });

        it('should persist data', () => {
            const uut = new Cache({ cacheExpiry, refreshFunction }, { logger });
            sandbox.stub(uut, 'fetch').resolves(data);

            uut.data = null;

            return uut.buildCache()
                .then(() => {
                    should(uut.data).eql(data);
                })
        });

        it('should update refreshTime on success', () => {
            const uut = new Cache({ cacheExpiry, refreshFunction }, { logger });
            sandbox.stub(uut, 'fetch').resolves(data);

            uut.refeshTime = 0;
            return uut.buildCache()
                .then(() => {
                    should(uut.refreshTime).eql(100);
                })
        });

        it('should not update refreshTime on failure', (done) => {
            const uut = new Cache({ cacheExpiry, refreshFunction }, { logger });
            sandbox.stub(uut, 'fetch').callsFake(() => Promise.reject(new Error('rejected')));

            uut.refeshTime = 0;

            // deliberately not returning as we're using the done callback
            uut.buildCache()
                .then(() => {
                    done(new Error('should have thrown'));
                })
                .catch(() => {
                    should(uut.refreshTime).eql(0);
                    done();
                })
                .catch((err) => done(err instanceof Error ? err : new Error(err)))
        });

        it('should reset currentRefresh on success', () => {
            const uut = new Cache({ cacheExpiry, refreshFunction }, { logger });
            sandbox.stub(uut, 'fetch').resolves(data);

            uut.currentRefresh = 'test';

            return uut.buildCache()
                .then(() => {
                    should(uut.currentRefresh).eql(null);
                })
        });

        it('should reset currentRefresh on failure', (done) => {
            const uut = new Cache({ cacheExpiry, refreshFunction }, { logger });
            sandbox.stub(uut, 'fetch').callsFake(() => Promise.reject(new Error('rejected')));

            // deliberately not returning as we're using the done callback
            uut.buildCache()
                .then(() => {
                    done(new Error('should have thrown'));
                })
                .catch(() => {
                    should(uut.currentRefresh).eql(null);
                    done();
                })
                .catch((err) => done(err instanceof Error ? err : new Error(err)))
        });
    });

    describe('Cache.fetch', () => {
        const cacheExpiry = 50;

        it('should reject promise if any errors', () => {
            const refreshFunction = () => {throw new Error('reject')};

            const test = new Cache({cacheExpiry, refreshFunction}, { logger });
            return (test.fetch().should.be.rejectedWith('Refresh error: reject'));
        });

        it('should return data from refresh function', () => {
            const data = {
                test: true,
            };
            const refreshFunction = () => data;

            const test = new Cache({cacheExpiry, refreshFunction}, { logger });
            return test.fetch()
                .then((res) => res.should.be.eql(data));
        });
    });
});
