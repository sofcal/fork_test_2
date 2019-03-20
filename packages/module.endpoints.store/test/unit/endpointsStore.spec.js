const should = require('should');
const sinon = require('sinon');
const imported = require('../../lib/endpointsStore');
const { Cache } = require('@sage/bc-data-cache');
const { Jwks } = require('@sage/sfab-s2s-jwt-jwks');

const { EndpointsStore } = imported;

describe('module-endpoints-store.endpointsStore', function () {
    const endpointMappings = {
        serv1: 'endpoint1',
        serv2: 'endpoint2',
    };
    const refreshDelay = 100;

    const logger = {
        info: (msg) => console.log(msg),
        error: (msg) => console.error(msg),
    };

    const test = new EndpointsStore(
        {
            endpointMappings,
            refreshDelay,
            cacheClass: Cache,
        },
        { logger }
    );

    const mockData = {
        kid1: [
            'cert1',
        ],
        kid2: [
            'cert2',
        ],
    };

    it('should export the correct modules', (done) => {
        imported.should.have.only.keys('EndpointsStore');
        done();
    });

    describe('EndpointsStore.constructor', () => {
        it('should be able to create new store object', () => {
            test.should.be.Object();
            test.should.be.instanceof(EndpointsStore);
        });

        it('should create store object with correct properties', () => {
            should.strictEqual(test.refreshDelay, refreshDelay);
            should.strictEqual(test.endpointMappings, endpointMappings);
            test.cacheList.should.match({});
        });

        it('should default cache Class if not provided', () => {
            should.strictEqual(test.Cache, Cache);
        });

        it('should allow cache Class to be overwritten', () => {
            class testClass {
                getData() { }
            }
            const testStore = new EndpointsStore(
                {
                    endpointMappings,
                    refreshDelay,
                    cacheClass: testClass,
                },
                { logger }
            );
            should.strictEqual(testStore.Cache.name, 'testClass');
        });

        it('should default cache Class to Cache if not passed', () => {
            const testStore = new EndpointsStore(
                {
                    endpointMappings,
                    refreshDelay,
                },
                { logger }
            );

            should.strictEqual(testStore.Cache.name, 'Cache');
        });

        it('should throw when cache class invalid or missing', () => {
            class dummyCache { }
            should.throws(() => new EndpointsStore({
                endpointMappings,
                refreshDelay,
                cacheClass: null,
            }, logger));
            should.throws(() => new EndpointsStore({
                endpointMappings,
                refreshDelay,
                cacheClass: 'Cache',
            }, logger));
            should.throws(() => new EndpointsStore({
                endpointMappings,
                refreshDelay,
                cacheClass: dummyCache,
            }, logger));
        });

        it('should throw when endpointMappings invalid or missing', () => {
            should.throws(() => new EndpointsStore({
                endpointMappings: '',
                refreshDelay,
                cacheClass: Cache,
            }, logger));
            should.throws(() => new EndpointsStore({
                refreshDelay,
                cacheClass: Cache,
            }, logger));
        });

        it('should throw when refreshDelay invalid or missing', () => {
            should.throws(() => new EndpointsStore({
                endpointMappings,
                refreshDelay: 'error',
                cacheClass: Cache,
            }, logger));
            should.throws(() => new EndpointsStore({
                endpointMappings,
                cacheClass: Cache,
            }, logger));
        });

        it('should throw when logger invalid or missing', () => {
            const noop = () => { };
            should.throws(() => new EndpointsStore({
                endpointMappings,
                refreshDelay,
                cacheClass: Cache,
            }, {logger: 'logger'}));
            should.throws(() => new EndpointsStore({
                endpointMappings,
                refreshDelay,
                cacheClass: Cache,
            }, {logger: {info: noop }}));
            should.throws(() => new EndpointsStore({
                endpointMappings,
                refreshDelay,
                cacheClass: Cache,
            }, {logger: { error: noop }}));
        });

        it('should default logger when not passed in', () => {
            const testStore = new EndpointsStore(
                {
                    endpointMappings,
                    refreshDelay,
                    cacheClass: Cache,
                }
            );
    
            (testStore.logger).should.be.a.Object();
            (testStore.logger).should.have.properties(['info', 'warn', 'error']);
            should.equal(testStore.logger.error(), undefined);
        });

    });

    describe('EndpointsStore.getCache', () => {
        let createCacheEntryStub;

        before(() => {
            createCacheEntryStub = sinon.stub(EndpointsStore.prototype, 'createCacheEntry');
        });

        after(() => {
            sinon.restore();
        });

        it('should return existing list if already cached', () => {
            const ID = Object.keys(endpointMappings)[0];

            const mockCache = {
                getData: sinon.stub().returns(mockData),
            };
            test.cacheList[ID] = mockCache;
            return test.getCache(ID)
                .then((data) => {
                    data.should.be.eql(mockData);

                    should.strictEqual(mockCache.getData.calledOnce, true);
                    should.strictEqual(createCacheEntryStub.notCalled, true);
                });
        });

        it('should create new list if not already cached', () => {
            const ID = Object.keys(endpointMappings)[1];
            const mockCache = {
                buildCache: () => { },
                getData: sinon.stub().returns(mockData),
            };

            createCacheEntryStub.callsFake(() => {
                test.cacheList[ID] = mockCache;
                return mockCache;
            });

            return test.getCache(ID)
                .then((data) => {
                    data.should.be.eql(mockData);

                    should.strictEqual(mockCache.getData.calledOnce, true);
                    should.strictEqual(createCacheEntryStub.calledOnce, true);
                });
        });
    });

    describe('EndpointsStore.createCacheEntry', () => {
        const dummyEntry = {
            dummyCache: true,
        };
        class DummyCache {
            constructor() { this.dummyCache = true }
            getData() { }
        }

        const test2 = new EndpointsStore(
            {
                endpointMappings,
                refreshDelay,
                cacheClass: DummyCache,
            }
            , { logger }
        );

        it('should return new cache entry', function () {
            const result = test2.createCacheEntry('ID', 'endPoint');
            result.toString().should.be.eql(dummyEntry.toString());
        });
    });

    describe('EndpointsStore.getEndPoint', () => {
        it('should return valid endPoint', function () {
            const ID = Object.keys(endpointMappings)[0];
            const result = test.getEndpoint(ID);

            result.should.be.eql(endpointMappings[ID]);
        });

        it('should throw if endpoint not known', () => {
            const ID = 'unknown';

            should.throws(() => test.getEndpoint(ID), /^Error: IDInvalid$/);
        });
    });

    describe('EndpointsStore.mappingFn', () => {
        let ConvertX5CToPeStub;

        before(() => {
            ConvertX5CToPeStub = sinon.stub(Jwks, 'ConvertX5CToPem');
        });

        after(() => {
            sinon.restore();
        });

        it('should map response object to expected result object', () => {
            ConvertX5CToPeStub.returns('cert');
            const res =  {
                body: {
                        keys : [
                        {
                            kid: 'kid1',
                            x5c: [
                                'cert1',
                            ]
                        },
                        {
                            kid: 'kid2',
                            x5c: [
                                'cert2',
                            ]
                        }
                    ]
                },
            };
            const expected = {
                kid1: [
                    'cert',
                ],
                kid2: [
                    'cert',
                ],
            };
            EndpointsStore.mappingFn(res).should.eql(expected);
        });

        it('should return empty object if no results returned', () => {
            const res =  {
                body: {},
            };
            const expected = {};
            EndpointsStore.mappingFn(res).should.eql(expected);
        });        
    });

    describe('EndpointsStore.refreshFn', () => {
        it('should return a function', () => {
            EndpointsStore.refreshFn(null).should.be.Function();
        });

        it('should be a rejected promise when calling returned fucntion with invalid endpoint', () => {
            const refresh = EndpointsStore.refreshFn(null)
            refresh().should.be.rejected();
        });
    });
});
