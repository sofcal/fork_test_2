const imported = require('../../lib/cache');
const should = require('should');
const sinon = require('sinon');
const nock = require('nock');
const needle = require('needle');

const { Cache } = imported;

describe('@sage/bc-data-cache.Cache', function(){
    const logger = {
        info: (msg) => console.log(msg),
        error: (msg) => console.error(msg),
    };
        
    it('should export the correct modules', (done) => {
        imported.should.have.only.keys('Cache');
        done();
    });

    describe('Cache.constructor', () => {
        const cacheExpiry = 100;
        const refreshFunction = () => 'test';

        it('should be able to create new cache object', () => {
            const test = new Cache({cacheExpiry, refreshFunction}, { logger });
    
            test.should.be.Object();
            test.should.be.instanceof(Cache);
        });
    
        it('should create cache object with correct properties', () => {
            const test = new Cache({cacheExpiry, refreshFunction}, { logger });
    
            should.strictEqual(test.cacheExpiry, cacheExpiry);
            should.strictEqual(test.refreshFunction, refreshFunction);
            test.data.should.match({});
        });

        it('should throw when refresh function invalid or missing', () => {
            should.throws( () => new Cache({ cacheExpiry, refreshFunction: 'refreshFunction' }, { logger }) );
            should.throws( () => new Cache({ cacheExpiry }, { logger }) );
        });

        it('should throw when cacheExpiry invalid or missing', () => {
            should.throws( () => new Cache({ cacheExpiry: 'cacheExpiry', refreshFunction }, { logger }) );
            should.throws( () => new Cache({ refreshFunction }, { logger }) );
        });

        it('should throw when logger invalid', () => {
            const noop = () => {};
            should.throws( () => new Cache({ cacheExpiry, refreshFunction }, { logger: 'logger'}) );
            should.throws( () => new Cache({ cacheExpiry, refreshFunction }, { logger: {info: noop} }) );
            should.throws( () => new Cache({ cacheExpiry, refreshFunction }, { logger: {error: noop} }) );
        });

        it('should default logger when not passed in', () => {
            const test = new Cache({cacheExpiry, refreshFunction});
    
            (test.logger).should.be.a.Object();
            (test.logger).should.have.properties(['info', 'warn', 'error']);
            should.equal(test.logger.error(), undefined);
        });
    });

    describe('Cache.cacheExpired() ', () => {
        const cacheExpiry = 50;
        const refreshFunction = () => 'test';

        before(() => {
            sinon.stub(Date, 'now').returns(100000); // 100 seconds
        });

        after(() => {
            sinon.restore();
        });

        it('should return false if non-expiring', () => {
            const test = new Cache({cacheExpiry: -1, refreshFunction}, { logger });
            test.refreshTime = 0;

            should.strictEqual(test.cacheExpired(), false);
        });

        it('should return true if cache expired', () => {
            const test = new Cache({cacheExpiry, refreshFunction}, { logger });
            test.refreshTime = 0;

            should.strictEqual(test.cacheExpired(), true);
        });

        it('should return false if cache still valid', () => {
            const test = new Cache({cacheExpiry, refreshFunction}, { logger });
            test.refreshTime = 100;

            should.strictEqual(test.cacheExpired(), false);
        });

        it('should return false if cache still valid - boundary test', () => {
            const test = new Cache({cacheExpiry, refreshFunction}, { logger });
            test.refreshTime = 50;

            should.strictEqual(test.cacheExpired(), false);
        });
    });

    describe('Cache.getData ', () => {
        const cacheExpiry = 50;
        const refreshFunction = () => 'test';
        const data = {
            test: true,
        };
        let test = new Cache({cacheExpiry, refreshFunction}, { logger });

        let cacheExpiredStub;
        let buildCacheStub;

        before(() => {
            cacheExpiredStub = sinon.stub(Cache.prototype, 'cacheExpired');
            buildCacheStub = sinon.stub(Cache.prototype, 'buildCache')
        });

        afterEach(() => {
            cacheExpiredStub.reset();
            buildCacheStub.reset();
        })

        after(() => {
            sinon.restore();
        });

        it('should return a promise', () => {
            cacheExpiredStub.returns(false);

            (test.getData()).should.be.Promise();
        });

        it('should call cacheExpired method if not force refresh', () => {
            cacheExpiredStub.returns(false);

            return test.getData()
                .then(() => should.strictEqual(cacheExpiredStub.called, true));
        });

        it('should not call cacheExpired method if force refresh', () => {
            cacheExpiredStub.returns(false);
            buildCacheStub.returns(Promise.resolve());
            test.currentRefresh = null;

            return test.getData(true)
                .then(() => should.strictEqual(cacheExpiredStub.called, false))
                .then(() => should.strictEqual(buildCacheStub.called, true));
        });

        it('should reject promise if any errors', () => {
            cacheExpiredStub.throws(() => new Error('reject'));

            return (test.getData()).should.be.rejectedWith('reject');
        });

        it('should call build Cache if cache expired and no in-flight refresh', () => {
            cacheExpiredStub.returns(true);
            buildCacheStub.returns(Promise.resolve());
            test.currentRefresh = null;

            return test.getData()
                .then(() => should.strictEqual(buildCacheStub.called, true));
        });

        it('should not call build Cache if cache expired and current in-flight refresh', () => {
            cacheExpiredStub.returns(true);

            test.currentRefresh = Promise.resolve()
                .then(() => {
                    this.data = data;
                    this.refreshTime = Math.floor(Date.now() / 1000);
                    this.currentRefresh = null;
                })

            return test.getData()
                .then(() => should.strictEqual(buildCacheStub.called, false));
        });

        it('should wait for any in-flight refresh to complete before returning', () => {
            cacheExpiredStub.returns(true);

            test.currentRefresh = Promise.resolve()
                .then(() => {
                    test.data = data;
                    test.refreshTime = Math.floor(Date.now() / 1000);
                    test.currentRefresh = null;
                })

            return test.getData()
                .then((res) => res.should.be.eql(data));
        });

        it('should return cache list', () => {
            cacheExpiredStub.returns(false);
            test.data = data;

            return test.getData()
                .then((res) => res.should.be.eql(data));
        });
    });

    describe('Cache.buildCache ', () => {
        const cacheExpiry = 50;

        const data = {
            test: true,
        };

        const refreshFunction = () => data;

        const test = new Cache({cacheExpiry, refreshFunction}, { logger });

        let fetchStub;

        before(() => {
            sinon.stub(Date, 'now').returns(100000); // 100 seconds
            fetchStub = sinon.stub(Cache.prototype, 'fetch');
        });

        after(() => {
            sinon.restore();
        });

        afterEach(() => {
            fetchStub.reset();
        });

        it('should return a promise', () => {
            fetchStub.returns(Promise.resolve(data));

            (test.buildCache()).should.be.Promise();
        });

        it('should reject promise if fetch throws any errors', () => {
            fetchStub.throws(() => new Error('reject'));

            return (test.buildCache()).should.be.rejectedWith('reject');
        });

        it('should reject promise if fetch promise rejects', () => {
            fetchStub.returns(Promise.reject(new Error('reject')));

            return (test.buildCache()).should.be.rejectedWith('reject');
        });

        it('should set data', function() {
            fetchStub.returns(Promise.resolve(data));

            return test.buildCache()
                .then(() => test.data.should.be.eql(data));
        });

        it('should update refreshtime', function() {
            fetchStub.returns(Promise.resolve(data));

            return test.buildCache()
                .then(() => test.refreshTime.should.be.eql(100))
        });

        it('should reset currentRefresh', function() {
            fetchStub.returns(Promise.resolve(data));
            test.currentRefresh = 'test';

            return test.buildCache()
                .then(() => should.not.exist(test.currentRefresh))
        });

        it('should populate data from fetch response', function() {
            fetchStub.callThrough();

            return test.buildCache()
                .then(() => test.data.should.be.eql(data));
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
