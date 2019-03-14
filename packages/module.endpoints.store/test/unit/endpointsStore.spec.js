const imported = require('../../src/endpointsStore');
const should = require('should');
const sinon = require('sinon');
const { JWKSCache } = require('../../src/endpointHandler');

const { EndPointsStore } = imported;

describe('internal-jwks-store.jwksstore', function(){
    const serviceMappings = {
        serv1: 'endpoint1',
        serv2: 'endpoint2',
    };
    const jwksDelay = 100;

    const logger = {
        info: (msg) => console.log(msg),
        error: (msg) => console.error(msg),
    };

    const test = new EndPointsStore(serviceMappings, jwksDelay, logger);

    const mockCerts = {
        kid1: [
            'cert1',
            'cert2',
        ],
        kid2: [
            'cert3',
            'cert4',
        ],
    };

    it('should export the correct modules', (done) => {
        imported.should.have.only.keys('EndPointsStore');
        done();
    });

    it('should be able to create new store object', () => {
        test.should.be.Object();
        test.should.be.instanceof(EndPointsStore);
    });

    it('should create store object with correct properties', () => {
        should.strictEqual(test.jwksDelay, jwksDelay);
        should.strictEqual(test.serviceMappings, serviceMappings);
        test.cacheList.should.match({});
    });

    it('should default cache Class if not provided', () => {
        should.strictEqual(test.Cache, JWKSCache);
    });

    it('should allow cache Class to be overwritten', () => {
        const testCache = new EndPointsStore(serviceMappings, jwksDelay, logger, 'test');
        should.strictEqual(testCache.Cache, 'test');
    });

    describe('EndPointsStore.getCertList', () => {
        let createCacheEntryStub;

        before(() => {
            createCacheEntryStub =  sinon.stub(EndPointsStore.prototype, 'createCacheEntry');
        });

        after(() => {
            sinon.restore();
        });

        it('should return existing list if already cached', () => {
            const serviceID = Object.keys(serviceMappings)[0];

            const mockCertObj = {
                getCerts: sinon.stub().returns(mockCerts),
            };
            test.cacheList[serviceID] = mockCertObj;
            return test.getCertList(serviceID)
                .then((data) => {
                    data.should.be.eql(mockCerts);

                    should.strictEqual(mockCertObj.getCerts.calledOnce, true);
                    should.strictEqual(createCacheEntryStub.notCalled, true);
                });
        });

        it('should create new list if not already cached', () => {
            const serviceID = Object.keys(serviceMappings)[1];
            const mockCache = {
                buildCache: () => {},
                getCerts: sinon.stub().returns(mockCerts),
            };

            createCacheEntryStub.callsFake(() => {
                test.cacheList[serviceID] = mockCache;
                return mockCache;
            });

            return test.getCertList(serviceID)
                .then((data) => {
                    data.should.be.eql(mockCerts);

                    should.strictEqual(mockCache.getCerts.calledOnce, true);
                    should.strictEqual(createCacheEntryStub.calledOnce, true);
                });
        });
    });

    describe('EndPointsStore.createCacheEntry', () => {
        const dummyEntry = {
            dummyCache: true,
        };
        const DummyCache = sinon.stub().callsFake(() =>  {
            return dummyEntry;
        });

        const test2 = new EndPointsStore(serviceMappings, jwksDelay, logger, DummyCache);

        it('should return new cache entry', function() {
            const result = test2.createCacheEntry('serviceID', 'endPoint');
            result.should.be.eql(dummyEntry);
        });
    });

    describe('EndPointsStore.getEndPoint', () => {
        it('should return valid endPoint', function() {
            const serviceID = Object.keys(serviceMappings)[0];
            const result = test.getEndPoint(serviceID);

            result.should.be.eql(serviceMappings[serviceID]);
        });

        it('should throw if endpoint not known', () => {
            const serviceID = 'unknown';

            should.throws(() => test.getEndPoint(serviceID), /^Error: authTokenIssuerInvalid$/);
        });
    });
});
