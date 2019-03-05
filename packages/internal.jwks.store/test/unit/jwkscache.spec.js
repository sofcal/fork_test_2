const imported = require('../../src/jwkscache');
const should = require('should');
const sinon = require('sinon');
const nock = require('nock');

const { JWKSCache } = imported;

describe('internal-jwks-store.jwkscache', function(){
    it('should export the correct modules', (done) => {
        imported.should.have.only.keys('JWKSCache');
        done();
    });

    it('should be able to create new cache object', () => {
        const endpoint = 'endpoint';
        const delay = 100;
        const test = new JWKSCache(endpoint, delay);

        test.should.be.Object();
        test.should.be.instanceof(JWKSCache);
    });

    it('should create cache object with correct properties', () => {
        const endpoint = 'endpoint';
        const delay = 100;
        const test = new JWKSCache(endpoint, delay);

        should.strictEqual(test.delay, delay);
        should.strictEqual(test.endPoint, endpoint);
        test.certList.should.match({});
    });

    describe('JWKSCache.cacheExpired() ', () => {

        before(() => {
            sinon.stub(Date, 'now').returns(100000); // 100 seconds
        });

        after(() => {
            sinon.restore();
        });

        it('should return true if cache expired', () => {
            const endpoint = 'endpoint';
            const delay = 50;
            const test = new JWKSCache(endpoint, delay);
            test._refreshTime = 0;

            should.strictEqual(test.cacheExpired(), true);
        });

        it('should return false if cache still valid', () => {
            const endpoint = 'endpoint';
            const delay = 50;
            const test = new JWKSCache(endpoint, delay);
            test._refreshTime = 100;

            should.strictEqual(test.cacheExpired(), false);
        });

        it('should return false if cache still valid - boundary test', () => {
            const endpoint = 'endpoint';
            const delay = 50;
            const test = new JWKSCache(endpoint, delay);
            test._refreshTime = 50;

            should.strictEqual(test.cacheExpired(), false);
        });
    });

    describe('JWKSCache.getCerts ', () => {
        const endpoint = 'endpoint';
        const delay = 50;
        let test = new JWKSCache(endpoint, delay);

        let cacheExpiredStub;
        let buildCacheStub;

        before(() => {
            cacheExpiredStub = sinon.stub(JWKSCache.prototype, 'cacheExpired');
            buildCacheStub = sinon.stub(JWKSCache.prototype, 'buildCache')
        });

        after(() => {
            sinon.restore();
        });

        it('should return a promise', () => {
            cacheExpiredStub.returns(false);

            (test.getCerts()).should.be.Promise();
        });

        it('should call cacheExpired method', () => {
            cacheExpiredStub.returns(false);

            return test.getCerts()
                .then(() => should.strictEqual(cacheExpiredStub.called, true));
        });

        it('should reject promise if any errors', () => {
            cacheExpiredStub.throws(() => new Error('reject'));

            return (test.getCerts()).should.be.rejectedWith('reject');
        });

        it('should call build Cache if cache expired', () => {
            cacheExpiredStub.returns(true);
            buildCacheStub.returns(Promise.resolve());

            return test.getCerts()
                .then(() => should.strictEqual(buildCacheStub.called, true));
        });

        it('should return cache list', () => {
            cacheExpiredStub.returns(false);
            const certList = {
                kid1: [
                    'cert1',
                    'cert2',
                ],
                kid2: [
                    'cert3',
                    'cert4',
                ],
            };
            test.certList = certList;

            return test.getCerts()
                .then((res) => res.should.be.eql(certList));
        });
    });


    describe('JWKSCache.buildCache ', () => {
        const endpoint = 'https://test1.com/buildCache';
        const delay = 50;
        let test = new JWKSCache(endpoint, delay);
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
        nock('https://test1.com')
            .get('/buildCache')
            .reply(200, {
                keys: endPointResponse.body.keys
            });

        let fetchEndPointStub;

        before(() => {
            sinon.stub(Date, 'now').returns(100000); // 100 seconds
            fetchEndPointStub = sinon.stub(JWKSCache.prototype, 'fetchEndPoint');
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

        it('should set certlist', function() {
            fetchEndPointStub.returns(Promise.resolve(endPointResponse));

            return test.buildCache()
                .then(() => test.certList.should.be.eql(certList));
        });

        it('should update refreshtime', function() {
            fetchEndPointStub.returns(Promise.resolve(endPointResponse));

            return test.buildCache()
                .then(() => test._refreshTime.should.be.eql(100))
        });

        it('should populate certList from endpoint', function() {
            fetchEndPointStub.callThrough();

            test.endPoint = endpoint;
            return test.buildCache()
                .then(() => test.certList.should.be.eql(certList));
        });
    });

    describe('JWKSCache.fetchEndPoint ', () => {
        const endpoint = undefined;
        const delay = 50;
        const test = new JWKSCache(endpoint, delay);
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
            return (test.fetchEndPoint()).should.be.rejectedWith('URL must be a string, not undefined');
        });

        it('should return keys from endpoint', () => {
           test.endPoint = 'https://test2.com/fetchEndPoint';
           return test.fetchEndPoint()
               .then((res) => res.body.should.be.eql(expected));
        });
    });
});
