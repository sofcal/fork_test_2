const should = require('should');
const sinon = require('sinon');
const nock = require('nock');
const EndpointStore = require('../../lib/EndpointStore');
const { Cache } = require('@sage/sfab-s2s-jwt-cache');
const { Jwks } = require('@sage/sfab-s2s-jwt-jwks');

describe('@sage/sfab-s2s-jwt-endpoint-store.EndpointStore', function(){
    const endpointMappings = {
        serv1: 'https://www.test.com/serv1',
        serv2: 'https://www.test.com/serv2',
        serv3: 'invalid',
    };
    const refreshDelay = 10;
    const endPointResponse = [
        {
            keys: [
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
        }, {
            keys: [
                {
                    kid: 'kid3',
                    x5c: [
                        'cert3',
                    ]
                },
                {
                    kid: 'kid4',
                    x5c: [
                        'cert4',
                    ]
                }

            ]
        },
    ];
    const expectedCertList = n =>
        endPointResponse[n].keys.reduce((final, response) => {
                final[response.kid] = [Jwks.ConvertX5CToPem(response.x5c[0])];
                return final;
            }
        , {});
    const logger = {
        info: (msg) => console.log(msg),
        error: (msg) => console.error(msg),
    };

    const test = new EndpointStore(
        {
            endpointMappings,
            refreshDelay,
            cacheClass: Cache,
        },
        { logger }
    );

    let dateStub;
    let cacheBuildSpy;

    before(() => {
        dateStub = sinon.stub(Date, 'now');
        cacheBuildSpy = sinon.spy(Cache.prototype, 'buildCache');
    });

    after(() => {
        nock.restore();
    });

    afterEach(() => {
       cacheBuildSpy.resetHistory();
    });

    describe('Create new store', () => {
        it('should allow new instance of EndpointStore to be created', () => {
            test.should.be.instanceOf(EndpointStore);
        });

        it('should set default values when not passed in', () => {
            const testDefault = new EndpointStore(
                {
                    endpointMappings,
                    refreshDelay,
                }
            );
            testDefault.should.be.instanceOf(EndpointStore);
            should.equal(testDefault._Cache.name,'Cache');
            testDefault.logger.should.be.Object();
        });

        it('should throw when invalid parameters passed', () => {
            should.throws(() => new EndpointStore({
                endpointMappings: 'error',
                refreshDelay,
                cacheClass: Cache,
            }, { logger }));
            should.throws(() => new EndpointStore({
                endpointMappings,
                refreshDelay,
                cacheClass: null,
            }, { logger }));
            should.throws(() => new EndpointStore({
                endpointMappings,
                refreshDelay: null,
                cacheClass: Cache,
            }, { logger }));
            should.throws(() => new EndpointStore({
                endpointMappings,
                refreshDelay,
                cacheClass: Cache,
            }, { logger:'logger'}));
            should.throws(() => new EndpointStore({
                endpointMappings,
                refreshDelay,
                cacheClass: Cache,
            }, {logger: {invalidLogger: true}}));
        });

        it('should create new instance of EndpointStore when EndpointStore.Create called', () => {
            const testCreate = EndpointStore.Create(
                {
                    endpointMappings,
                    refreshDelay,
                    cacheClass: Cache,
                },
                { logger }
            );

            testCreate.should.be.instanceOf(EndpointStore);
        });
    });

    describe('Get cache processing', () => {
        it('should retrieve and return keys from endpoint', () => {
            dateStub.returns(200000); // 200 seconds
            return test.getCache(Object.keys(endpointMappings)[0])
                .then((res) => res.should.eql(expectedCertList(0)))
                .then(() => should.strictEqual(cacheBuildSpy.called, true));
        });

        it('should return keys from cache when cache not expired', () => {
            dateStub.returns(100000); // 100 seconds
            return test.getCache(Object.keys(endpointMappings)[0])
                .then((res) => res.should.eql(expectedCertList(0)))
                .then(() => should.strictEqual(cacheBuildSpy.called, false));
        });

        it('should refresh keys from endpoint when cache expired', () => {
            dateStub.returns(300000 + (refreshDelay * 1000 * 2));
            const ID = Object.keys(endpointMappings)[0];
            return test.getCache(ID)
                .then((res) => res.should.eql(expectedCertList(0)))
                .then(() => should.strictEqual(cacheBuildSpy.called, true));
        });

        it('should return empty object when no keys found', () => {
            dateStub.returns(300000 + (refreshDelay * 1000 * 2));
            const ID = Object.keys(endpointMappings)[1];
            return test.getCache(ID)
                .then((res) => res.should.eql({}))
                .then(() => should.strictEqual(cacheBuildSpy.called, true));
        });

        it('should reject when service endpoint not known', () => {
            const ID = 'unknown';
            return test.getCache(ID).should.be.rejectedWith('IDInvalid');
        });

        it('should reject when invalid service endpoint', () => {
            const ID = 'serv3';
            return test.getCache(ID).should.be.rejectedWith(/getaddrinfo ENOTFOUND invalid/);
        });
    });


    describe('getValidIds processing', () => {
        it('should return array of ids', () => {
            const ids = test.getValidIds();
            ids.should.be.an.Array();
            ids.should.be.eql(Object.keys(endpointMappings));
        });
    });

});
