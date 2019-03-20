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
        const endpoint = 'endpoint';
        const cacheExpiry = 100;
        const refreshFunction = () => 'test';

        it('should be able to create new cache object', () => {
            const test = new Cache({endpoint, cacheExpiry, refreshFunction}, logger);
    
            test.should.be.Object();
            test.should.be.instanceof(Cache);
        });
    
        it('should create cache object with correct properties', () => {
            const test = new Cache({endpoint, cacheExpiry, refreshFunction}, logger);
    
            should.strictEqual(test.cacheExpiry, cacheExpiry);
            should.strictEqual(test.endpoint, endpoint);
            should.strictEqual(test.refreshFunction, refreshFunction);
            test.data.should.match({});
        });

        it('should throw when refresh function invalid or missing', () => {
            should.throws( () => new Cache({ endpoint, cacheExpiry, refreshFunction: 'refreshFunction' }, logger) );
            should.throws( () => new Cache({ endpoint, cacheExpiry }, logger) );
        });

        it('should throw when endpoint invalid or missing', () => {
            should.throws( () => new Cache({ endpoint: {}, cacheExpiry, refreshFunction }, logger) );
            should.throws( () => new Cache({ cacheExpiry, refreshFunction }, logger) );
        });

        it('should throw when cacheExpiry invalid or missing', () => {
            should.throws( () => new Cache({ endpoint, cacheExpiry: 'cacheExpiry', refreshFunction }, logger) );
            should.throws( () => new Cache({ endpoint, refreshFunction }, logger) );
        });

        it('should throw when logger invalid or missing', () => {
            const noop = () => {};
            should.throws( () => new Cache({ endpoint, cacheExpiry, refreshFunction }, 'logger') );
            should.throws( () => new Cache({ endpoint, cacheExpiry, refreshFunction }, { info: noop }) );
            should.throws( () => new Cache({ endpoint, cacheExpiry, refreshFunction }, { error: noop }) );
        });

        it('should default logger when not passed in', () => {
            const test = new Cache({endpoint, cacheExpiry, refreshFunction});
    
            (test.logger).should.be.a.Object();
            (test.logger).should.have.properties(['info', 'warn', 'error']);
            should.equal(test.logger.error(), undefined);
        });
    });

    describe('Cache.cacheExpired() ', () => {
        const endpoint = 'endpoint';
        const cacheExpiry = 50;
        const refreshFunction = () => 'test';
        const mappingFunction = (data) => data;

        before(() => {
            sinon.stub(Date, 'now').returns(100000); // 100 seconds
        });

        after(() => {
            sinon.restore();
        });

        it('should return true if cache expired', () => {
            const test = new Cache({endpoint, cacheExpiry, refreshFunction}, logger);
            test.refreshTime = 0;

            should.strictEqual(test.cacheExpired(), true);
        });

        it('should return false if cache still valid', () => {
            const test = new Cache({endpoint, cacheExpiry, refreshFunction}, logger);
            test.refreshTime = 100;

            should.strictEqual(test.cacheExpired(), false);
        });

        it('should return false if cache still valid - boundary test', () => {
            const test = new Cache({endpoint, cacheExpiry, refreshFunction}, logger);
            test.refreshTime = 50;

            should.strictEqual(test.cacheExpired(), false);
        });
    });

    describe('Cache.getData ', () => {
        const endpoint = 'endpoint';
        const cacheExpiry = 50;
        const refreshFunction = () => 'test';
        const mappingFunction = (data) => data;
        const data = {
            kid1: [
                'cert1',
                'cert2',
            ],
            kid2: [
                'cert3',
                'cert4',
            ],
        };
        let test = new Cache({endpoint, cacheExpiry, refreshFunction}, logger);

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

        it('should call cacheExpired method', () => {
            cacheExpiredStub.returns(false);

            return test.getData()
                .then(() => should.strictEqual(cacheExpiredStub.called, true));
        });

        it('should reject promise if any errors', () => {
            cacheExpiredStub.throws(() => new Error('reject'));

            return (test.getData()).should.be.rejectedWith('reject');
        });

        it('should call build Cache if cache expired and no in-flight refresh', () => {
            cacheExpiredStub.returns(true);
            buildCacheStub.returns(Promise.resolve());

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
        const endpoint = 'https://test1.com/buildCache';
        const cacheExpiry = 50;

        const endPointResponse = {
            body:
                {
                    keys: [
                        {
                            kid: 'kid1',
                            x5c: [
                                'cert1',
                                'cert2'
                            ]
                        },
                        {
                            kid: 'kid2',
                            x5c: [
                                'cert3',
                                'cert4'
                            ]
                        }
                    ]
                }
        };
        const certList = {
            kid1: [
                'cert1',
                'cert2'
            ],
            kid2: [
                'cert3',
                'cert4'
            ]
        };

        const refreshFunction = () => {
            const { keys } = endPointResponse.body;
            return keys.reduce((acc, { kid, x5c }) => {
                acc[kid] = x5c;
                return acc;
            }, {});
        };

        const test = new Cache({endpoint, cacheExpiry, refreshFunction}, logger);

        nock('https://test1.com')
            .get('/buildCache')
            .reply(200, {
                keys: endPointResponse.body.keys
            });

        let fetchEndPointStub;

        before(() => {
            sinon.stub(Date, 'now').returns(100000); // 100 seconds
            fetchEndPointStub = sinon.stub(Cache.prototype, 'fetchEndPoint');
        });

        after(() => {
            sinon.restore();
        });

        afterEach(() => {
            fetchEndPointStub.reset();
        });

        it('should return a promise', () => {
            fetchEndPointStub.returns(Promise.resolve(endPointResponse));

            (test.buildCache()).should.be.Promise();
        });

        it('should reject promise if fetch throws any errors', () => {
            fetchEndPointStub.throws(() => new Error('reject'));

            return (test.buildCache()).should.be.rejectedWith('reject');
        });

        it('should reject promise if fetch promise rejects', () => {
            fetchEndPointStub.returns(Promise.reject(new Error('reject')));

            return (test.buildCache()).should.be.rejectedWith('reject');
        });

        it('should set data', function() {
            fetchEndPointStub.returns(Promise.resolve(certList));

            return test.buildCache()
                .then(() => test.data.should.be.eql(certList));
        });

        it('should update refreshtime', function() {
            fetchEndPointStub.returns(Promise.resolve(endPointResponse));

            return test.buildCache()
                .then(() => test.refreshTime.should.be.eql(100))
        });

        it('should reset currentRefresh', function() {
            fetchEndPointStub.returns(Promise.resolve(endPointResponse));
            test.currentRefresh = 'test';

            return test.buildCache()
                .then(() => should.not.exist(test.currentRefresh))
        });

        it('should populate data from endpoint', function() {
            fetchEndPointStub.callThrough();

            test.endPoint = endpoint;
            return test.buildCache()
                .then(() => test.data.should.be.eql(certList));
        });
    });

    describe('Cache.fetchEndPoint ', () => {
        const endpoint = ' ';
        const cacheExpiry = 50;

        const refreshFunction = function() {
            needle.defaults({
                user_agent: 'BankDrive'
            });

            return needle('get', this.endPoint);
        };
        const mappingFunction = (res) => {
            const { keys } = res.body;
            return keys.reduce((acc, { kid, x5c }) => {
                acc[kid] = x5c;
                return acc;
            }, {});
        };

        const test = new Cache({endpoint, cacheExpiry, refreshFunction}, logger);
        const expected = {
            keys: [
                {
                    kid: 'kid1',
                    x5c: [
                        'token1',
                        'token2',
                    ]
                },
                {
                    kid: 'kid2',
                    x5c: [
                        'token3',
                        'token4',
                    ]
                },
            ]
        };
        nock('https://test2.com/')
            .get('/fetchEndPoint')
            .reply(200, {
                keys: expected.keys
            });

        after(() => {
            nock.restore();
        });

        it('should reject promise if any errors', () => {
            return (test.fetchEndPoint()).should.be.rejectedWith('Fetch endpoint error: URL must be a string, not undefined');
        });

        it('should return keys from endpoint', () => {
           test.endPoint = 'https://test2.com/fetchEndPoint';
           return test.fetchEndPoint()
               .then((res) => res.body.should.be.eql(expected));
        });
    });
});
