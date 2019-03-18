const should = require('should');
const sinon = require('sinon');
const imported = require('../../src/endpointsStore');
const { Cache } = require('@sage/bc-data-cache');

const { EndpointsStore } = imported;

describe('module-endpoints-store.endpointsStore', function () {
    const endpointMappings = {
        serv1: 'endpoint1',
        serv2: 'endpoint2',
    };
    const cacheExpiry = 100;

    const logger = {
        info: (msg) => console.log(msg),
        error: (msg) => console.error(msg),
    };

    const noop = () => { };

    const test = new EndpointsStore({
        endpointMappings,
        cacheExpiry,
        logger,
        cacheClass: Cache,
        refreshFunction: noop,
        mappingFunction: (a) => a,
    });

    const mockData = {
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
        imported.should.have.only.keys('EndpointsStore');
        done();
    });

    describe('EndpointsStore.constructor', () => {
        it('should be able to create new store object', () => {
            test.should.be.Object();
            test.should.be.instanceof(EndpointsStore);
        });

        it('should create store object with correct properties', () => {
            should.strictEqual(test.cacheExpiry, cacheExpiry);
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
            const testStore = new EndpointsStore({
                endpointMappings,
                cacheExpiry,
                logger,
                cacheClass: testClass,
                refreshFunction: noop,
            });
            should.strictEqual(testStore.Cache.name, 'testClass');
        });

        it('should default cache Class to Cache if not passed', () => {
            const testStore = new EndpointsStore({
                endpointMappings,
                cacheExpiry,
                logger,
                refreshFunction: noop,
            });
            const myObj = { test: true };

            should.strictEqual(testStore.Cache.name, 'Cache');
              // should return same object passed to function
            (testStore.mappingFunction(myObj)).should.eql(myObj);
        });

        it('should default mapping function to identity function if not passed', () => {
            const testStore = new EndpointsStore({
                endpointMappings,
                cacheExpiry,
                logger,
                refreshFunction: noop,
            });
            should.strictEqual(testStore.mappingFunction.name, 'identityfn');
        });

        it('should throw when refresh function invalid or missing', () => {
            should.throws(() => new EndpointsStore({
                endpointMappings,
                cacheExpiry,
                logger,
                cacheClass: Cache,
                refreshFunction: 'refreshFunction',
                mappingFunction: (a) => a,
            }));
            should.throws(() => new EndpointsStore({
                endpointMappings,
                cacheExpiry,
                logger,
                cacheClass: Cache,
                mappingFunction: (a) => a,
            }));
        });

        it('should throw when mapping function invalid or missing', () => {
            should.throws(() => new EndpointsStore({
                endpointMappings,
                cacheExpiry,
                logger,
                cacheClass: Cache,
                refreshFunction: noop,
                mappingFunction: 'mappingFunction',
            }));
            should.throws(() => new EndpointsStore({
                endpointMappings,
                cacheExpiry,
                logger,
                cacheClass: Cache,
                refreshFunction: noop,
                mappingFunction: null,
            }));
        });

        it('should throw when cache class invalid or missing', () => {
            class dummyCache { }
            should.throws(() => new EndpointsStore({
                endpointMappings,
                cacheExpiry,
                logger,
                cacheClass: null,
                refreshFunction: noop,
                mappingFunction: (a) => a,
            }));
            should.throws(() => new EndpointsStore({
                endpointMappings,
                cacheExpiry,
                logger,
                cacheClass: 'Cache',
                refreshFunction,
                mappingFunction: (a) => a,
            }));
            should.throws(() => new EndpointsStore({
                endpointMappings,
                cacheExpiry,
                logger,
                cacheClass: dummyCache,
                refreshFunction: noop,
                mappingFunction: (a) => a,
            }));
        });

        it('should throw when endpointMappings invalid or missing', () => {
            should.throws(() => new EndpointsStore({
                endpointMappings: '',
                cacheExpiry,
                logger,
                cacheClass: Cache,
                refreshFunction: noop,
                mappingFunction: (a) => a,
            }));
            should.throws(() => new EndpointsStore({
                cacheExpiry,
                logger,
                cacheClass: Cache,
                refreshFunction: noop,
                mappingFunction: (a) => a,
            }));
        });

        it('should throw when cacheExpiry invalid or missing', () => {
            should.throws(() => new EndpointsStore({
                endpointMappings,
                cacheExpiry: 'error',
                logger,
                cacheClass: Cache,
                refreshFunction: noop,
                mappingFunction: (a) => a,
            }));
            should.throws(() => new EndpointsStore({
                endpointMappings,
                logger,
                cacheClass: Cache,
                refreshFunction: noop,
                mappingFunction: (a) => a,
            }));
        });

        it('should throw when logger invalid or missing', () => {
            const noop = () => { };
            should.throws(() => new EndpointsStore({
                endpointMappings,
                cacheExpiry,
                logger: 'logger',
                cacheClass: Cache,
                refreshFunction: noop,
                mappingFunction: (a) => a,
            }));
            should.throws(() => new EndpointsStore({
                endpointMappings,
                cacheExpiry,
                cacheClass: Cache,
                refreshFunction: noop,
                mappingFunction: (a) => a,
            }));
            should.throws(() => new EndpointsStore({
                endpointMappings,
                cacheExpiry,
                logger: { info: noop },
                cacheClass: Cache,
                refreshFunction: noop,
                mappingFunction: (a) => a,
            }));
            should.throws(() => new EndpointsStore({
                endpointMappings,
                cacheExpiry,
                logger: { error: noop },
                cacheClass: Cache,
                refreshFunction: noop,
                mappingFunction: (a) => a,
            }));
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

        const test2 = new EndpointsStore({
            endpointMappings,
            cacheExpiry,
            logger,
            cacheClass: DummyCache,
            refreshFunction: noop,
            mappingFunction: (a) => a,
        });

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
});
