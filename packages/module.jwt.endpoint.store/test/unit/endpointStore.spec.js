const EndpointStore = require('../../lib/EndpointStore');
const { Cache } = require('@sage/sfab-s2s-jwt-cache');
const { Jwks } = require('@sage/sfab-s2s-jwt-jwks');
const { logger: createLogger } = require('@sage/bc-debug-utils');
const sinon = require('sinon');
const should = require('should');

describe('@sage/sfab-s2s-jwt-endpoint-store.EndpointStore', function () {
    const logger = createLogger(true);
    const refreshDelay = 100;
    const endpointMappings = {
        serv1: 'endpoint1',
        serv2: 'endpoint2',
    };

    const sandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
    });

    it('should export the correct modules', () => {
        should(EndpointStore).be.a.Function();
    });

    describe('Create', () => {
        it('should be able to create new EndpointStore object', () => {
            const actual = EndpointStore.Create({ endpointMappings, refreshDelay, cacheClass: Cache, }, { logger });

            actual.should.be.Object();
            actual.should.be.instanceof(EndpointStore);
        });
    });

    describe('constructor', () => {
        it('should be able to create new store object', () => {
            const actual = new EndpointStore({ endpointMappings, refreshDelay, cacheClass: Cache, }, { logger });

            actual.should.be.Object();
            actual.should.be.instanceof(EndpointStore);
        });

        it('should create store object with correct properties', () => {
            const actual = new EndpointStore({ endpointMappings, refreshDelay, cacheClass: Cache }, { logger });
            should(actual.refreshDelay).eql(refreshDelay);
            should(actual.endpointMappings).eql(endpointMappings);
            should(actual.cacheList).eql({});
        });

        it('should default cache Class if not provided', () => {
            const actual = new EndpointStore({ endpointMappings, refreshDelay }, { logger });
            should(actual._Cache).eql(Cache);
        });

        it('should allow cache Class to be overwritten', () => {
            class TestCache { getData() { } }
            const actual = new EndpointStore({ endpointMappings, refreshDelay, cacheClass: TestCache }, { logger });
            should(actual._Cache).eql(TestCache);
        });

        it('should throw when cache class invalid or missing', () => {
            class dummyCache { }
            const expected = new Error('Invalid argument passed: cacheClass');

            should(
                () => new EndpointStore({ endpointMappings, refreshDelay, cacheClass: null }, logger)
            ).throw(expected);
            should(
                () => new EndpointStore({ endpointMappings, refreshDelay, cacheClass: 'Cache' }, logger)
            ).throw(expected);
            should(
                () => new EndpointStore({ endpointMappings, refreshDelay, cacheClass: dummyCache }, logger)
            ).throw(expected);
        });

        it('should throw when endpointMappings invalid', () => {
            const expected = new Error('Invalid argument passed: endpointMappings not an object');

            should(
                () => new EndpointStore({ endpointMappings: '', refreshDelay, cacheClass: Cache }, logger)
            ).throw(expected);
        });

        it('should throw when refreshDelay invalid or missing', () => {
            const expected = new Error('Invalid argument passed: refreshDelay not a number');
            should(
                () => new EndpointStore({ endpointMappings, refreshDelay: 'error', cacheClass: Cache }, logger)
            ).throw(expected);
            should(
                () => new EndpointStore({ endpointMappings, cacheClass: Cache }, logger)
            ).throw(expected);
        });

        it('should throw when logger invalid or missing', () => {
            const expected = new Error('Invalid argument passed: Logger not valid');

            const noop = () => { };
            should(
                () => new EndpointStore({ endpointMappings, refreshDelay, cacheClass: Cache }, { logger: 'logger' })
            ).throw(expected);
            should(
                () => new EndpointStore({ endpointMappings, refreshDelay, cacheClass: Cache }, { logger: {info: noop } })
            ).throw(expected);
            should(
                () => new EndpointStore({ endpointMappings, refreshDelay, cacheClass: Cache }, { logger: { error: noop } })
            ).throw(expected);
        });

        it('should default endpointMappings when not passed in', () => {
            const actual = new EndpointStore({ refreshDelay, cacheClass: Cache });

            should(actual.endpointMappings).eql({});
        });

        it('should default logger when not passed in', () => {
            const actual = new EndpointStore({ endpointMappings, refreshDelay, cacheClass: Cache });
    
            should(actual.logger).be.a.Object();
            should(actual.logger).have.properties(['info', 'warn', 'error']);
            should(actual.logger.error()).eql(undefined);
        });

    });

    describe('getCache', () => {
        let uut;
        let mockData;

        beforeEach(() => {
            uut = new EndpointStore({ endpointMappings, refreshDelay, cacheClass: Cache }, { logger });
            mockData = { kid1: ['cert1'], kid2: ['cert2'] };
        });

        it('should return data from existing cache if already exists', () => {
            const ID = Object.keys(endpointMappings)[0];
            const mockCache = { getData: sandbox.stub() };
            uut.cacheList[ID] = mockCache;

            return uut.getCache(ID, false)
                .then(() => {
                    should(uut.cacheList).eql({ [ID]: mockCache });
                });
        });

        it('should create new cache if one does not already exist', () => {
            const ID = Object.keys(endpointMappings)[1];

            const mockCache = {
                buildCache: () => { },
                getData: sinon.stub().returns(mockData),
            };
            sandbox.stub(uut._Cache, 'Create').returns(mockCache);

            return uut.getCache(ID, false)
                .then(() => {
                    should(uut.cacheList).eql({ [ID]: mockCache });
                    should(uut._Cache.Create.callCount).eql(1);
                    should(uut._Cache.Create.calledWithExactly(
                        { cacheExpiry: -1, refreshFunction: sinon.match.func }, { logger: sinon.match.object }
                    )).eql(true);
                });
        });

        it('should throw an error if the ID is not present in the service mappings', (done) => {
            const ID = 'invalid';

            const mockCache = {
                buildCache: () => { },
                getData: sinon.stub().returns(mockData),
            };
            sandbox.stub(uut._Cache, 'Create').returns(mockCache);

            // deliberately not returned as we're using the callback done
            uut.getCache(ID, false)
                .then(() => {
                    done(new Error('should have thrown'));
                })
                .catch((err) => {
                    const expected = new Error('IDInvalid');
                    should(err).eql(expected);

                    should(uut._Cache.Create.callCount).eql(0);

                    done();
                });
        });

        it('should not force a cache refresh if refreshDelay is not exceeded', () => {
            sandbox.useFakeTimers(0);

            uut.refreshDelay = 10;

            const ID = Object.keys(endpointMappings)[0];
            const mockCache = { getData: sandbox.stub(), refreshTime: 0 };
            uut.cacheList[ID] = mockCache;

            return uut.getCache(ID, true)
                .then(() => {
                    should(mockCache.getData.callCount).eql(1);
                    should(mockCache.getData.calledWithExactly(
                        false
                    )).eql(true);
                });
        });

        it('should not force a cache refresh if refreshDelay is not exceeded (boundary)', () => {
            sandbox.useFakeTimers(10999);

            uut.refreshDelay = 10;

            const ID = Object.keys(endpointMappings)[0];
            const mockCache = { getData: sandbox.stub(), refreshTime: 0 };
            uut.cacheList[ID] = mockCache;

            return uut.getCache(ID, true)
                .then(() => {
                    should(mockCache.getData.callCount).eql(1);
                    should(mockCache.getData.calledWithExactly(
                        false
                    )).eql(true);
                });
        });

        it('should not force a cache refresh if tryRefresh is false', () => {
            const ID = Object.keys(endpointMappings)[0];
            const mockCache = { getData: sandbox.stub() };
            uut.cacheList[ID] = mockCache;

            return uut.getCache(ID, false)
                .then(() => {
                    should(mockCache.getData.callCount).eql(1);
                    should(mockCache.getData.calledWithExactly(
                        false
                    )).eql(true);
                });
        });

        it('should force a cache refresh if tryRefresh is true and refreshDelay is exceeded', () => {
            sandbox.useFakeTimers(11000); // ensure refreshDelay is exceeded

            uut.refreshDelay = 10;

            const ID = Object.keys(endpointMappings)[0];
            const mockCache = { getData: sandbox.stub(), refreshTime: 0 };
            uut.cacheList[ID] = mockCache;

            return uut.getCache(ID, true)
                .then(() => {
                    should(mockCache.getData.callCount).eql(1);
                    should(mockCache.getData.calledWithExactly(
                        true
                    )).eql(true);
                });
        });

        it('should force a cache refresh if tryRefresh is not provided and refreshDelay is exceeded', () => {
            sandbox.useFakeTimers(11000); // ensure refreshDelay is exceeded

            uut.refreshDelay = 10;

            const ID = Object.keys(endpointMappings)[0];
            const mockCache = { getData: sandbox.stub(), refreshTime: 0 };
            uut.cacheList[ID] = mockCache;

            return uut.getCache(ID)
                .then(() => {
                    should(mockCache.getData.callCount).eql(1);
                    should(mockCache.getData.calledWithExactly(
                        true
                    )).eql(true);
                });
        });

        describe('refreshFunction', () => {
            let uut;
            let refresh;

            beforeEach(() => {
                uut = new EndpointStore({ endpointMappings, refreshDelay, cacheClass: Cache }, { logger });

                const ID = Object.keys(endpointMappings)[0];

                const mockCache = {
                    getData: sinon.stub().returns(mockData),
                };
                sandbox.stub(uut._Cache, 'Create').returns(mockCache);

                return uut.getCache(ID, false)
                    .then(() => {
                        // store the refresh that was created so we can perform further tests on it
                        refresh = uut._Cache.Create.getCall(0).args[0].refreshFunction;
                    });
            });


            it('should call the given endpoint when invoking the refresh function', () => {
                sandbox.stub(Jwks, 'ConvertX5CToPem').callsFake((input) => input);
                sandbox.stub(uut._needle, 'getAsync').resolves({
                    body: {
                        keys: [
                            { kid: 'kid1', x5c: ['cert1'] },
                            { kid: 'kid2', x5c: ['cert2'] }
                        ]
                    }
                });

                return refresh()
                    .then(() => {
                        should(uut._needle.getAsync.callCount).eql(1);
                        should(uut._needle.getAsync.calledWithExactly(
                            'endpoint1'
                        )).eql(true);
                    })
            });

            it('should map the response to the correct format', () => {
                sandbox.stub(Jwks, 'ConvertX5CToPem').callsFake((input) => input);
                sandbox.stub(uut._needle, 'getAsync').resolves({
                    body: {
                        keys: [
                            { kid: 'kid1', x5c: ['cert1'] },
                            { kid: 'kid2', x5c: ['cert2'] }
                        ]
                    }
                });

                return refresh()
                    .then((actual) => {
                        const expected = { kid1: ['cert1'], kid2: ['cert2'] };
                        should(actual).eql(expected);
                    })
            });

            it('should throw an error if the refresh fails', () => {
                const expected = new Error('Fetch endpoint error: error_needle');
                sandbox.stub(Jwks, 'ConvertX5CToPem').callsFake((input) => input);
                sandbox.stub(uut._needle, 'getAsync').rejects(new Error('error_needle'));

                should(refresh()).be.rejectedWith(expected);
            });

            it('should throw an error if the mapping function fails', () => {
                sandbox.stub(Jwks, 'ConvertX5CToPem').throws(new Error('error_convert'));
                sandbox.stub(uut._needle, 'getAsync').resolves({
                    body: {
                        keys: [
                            { kid: 'kid1', x5c: ['cert1'] },
                            { kid: 'kid2', x5c: ['cert2'] }
                        ]
                    }
                });

                const expected = new Error('Fetch endpoint error: error_convert');
                should(refresh()).be.rejectedWith(expected);
            });
        })
    });

    describe('createCacheEntry', () => {
        let uut;

        beforeEach(() => {
            uut = new EndpointStore({ endpointMappings, refreshDelay, cacheClass: Cache }, { logger });
        });

        it('should return new cache entry', function () {
            const mockCache = {};
            sandbox.stub(uut._Cache, 'Create').returns(mockCache);

            const actual = uut.createCacheEntry('ID', 'endPoint');
            should(actual).eql(mockCache);

            should(uut._Cache.Create.callCount).eql(1);
            should(uut._Cache.Create.calledWithExactly(
                { cacheExpiry: -1, refreshFunction: sinon.match.func }, { logger: sinon.match.object }
            )).eql(true);
        });
    });

    describe('getEndPoint', () => {
        it('should return valid endPoint', function () {
            const uut = new EndpointStore({ endpointMappings, refreshDelay, cacheClass: Cache }, { logger });
            const ID = Object.keys(endpointMappings)[0];

            should(uut.getEndpoint(ID)).eql(endpointMappings[ID]);
        });

        it('should throw if endpoint not known', () => {
            const uut = new EndpointStore({ endpointMappings, refreshDelay, cacheClass: Cache }, { logger });
            const ID = 'unknown';

            should(
                () => uut.getEndpoint(ID)
            ).throw(new Error('IDInvalid'));
        });
    });

    describe('MappingFn', () => {
        it('should map response object to expected result object', () => {
            sandbox.stub(Jwks, 'ConvertX5CToPem').returns('cert');

            const keys = [
                { kid: 'kid1', x5c: ['cert1'] },
                { kid: 'kid2', x5c: ['cert2'] }
            ];

            const expected = { kid1: ['cert'], kid2: ['cert'] };
            EndpointStore.MappingFn(keys).should.eql(expected);
        });

        it('should return empty object if no results returned', () => {
            const expected = {};
            EndpointStore.MappingFn(undefined).should.eql(expected);
        });        
    });

    describe('createRefreshFunction', () => {
        it('should return a Promise', () => {
            const uut = new EndpointStore({ endpointMappings, refreshDelay, cacheClass: Cache }, { logger });
            should(uut.createRefreshFunction(null)).be.Function();
        });

        it('should be a rejected promise when calling returned function with invalid endpoint', () => {
            const uut = new EndpointStore({ endpointMappings, refreshDelay, cacheClass: Cache }, { logger });
            const refresh = uut.createRefreshFunction(null);
            should(refresh()).be.rejectedWith(new Error(`Fetch endpoint error: URL must be a string, not null`));
        });
    });

    describe('getValidIds', () => {
        it('should return array of ids', () => {
            const uut = new EndpointStore({ endpointMappings, refreshDelay, cacheClass: Cache }, { logger });
            const ids = uut.getValidIds();
            should(ids).be.an.Array();
            should(ids).eql(Object.keys(endpointMappings));
        });
    });
});
