const should = require('should');
const sinon = require('sinon');
const nock = require('nock');
const needle = require('needle');
const { EndpointsStore }  = require('../../lib/endpointsStore');
const { Cache } = require('@sage/bc-data-cache');

describe('module-endpoints-store', function(){
    const endpointMappings = {
        serv1: 'https://www.test.com/serv1',
        serv2: 'https://www.test.com/serv2',
        serv3: 'invalid',
    };
    const cacheExpiry = 10;
    const endPointResponse = [
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
        }, {
            keys: [
                {
                    kid: 'kid3',
                    x5c: [
                        'cert4',
                        'cert5'
                    ]
                },
                {
                    kid: 'kid4',
                    x5c: [
                        'cert6',
                        'cert7'
                    ]
                }

            ]
        },
    ];
    const expectedCertList = n =>
        endPointResponse[n].keys.reduce((final, response) => {
                final[response.kid] = response.x5c;
                return final;
            }
        , {});
    const logger = {
        info: (msg) => console.log(msg),
        error: (msg) => console.error(msg),
    };

    const mappingFunction = (res) => {
        const { keys } = res.body;
        return keys.reduce((final,{ kid, x5c }) => {
            final[kid] = x5c;
            return final;
        }, {})
    };

    const refreshFunction = function(endpoint) {
        return Promise.resolve()
            .then(() => needle('get', endpoint))
            .catch((err) => {
                console.log(`alert: ${err}`);
                throw new Error(`Fetch endpoint error: ${err.message}`);
            });
    }

    const test = new EndpointsStore({
        endpointMappings,
        cacheExpiry,
        logger,
        Cache,
        refreshFunction,
        mappingFunction
    });

    const nockEndPoints = nock('https://www.test.com')
        .persist()
        .get('/serv1')
        .reply(200, {
            keys: endPointResponse[0].keys
        })
        .get('/serv2')
        .reply(200, {
            keys: endPointResponse[1]
        });

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

    it('should allow new instance of EndpointsStore to be created', () => {
         test.should.be.instanceOf(EndpointsStore);
    });

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
        dateStub.returns(300000 + (cacheExpiry * 1000 * 2));
        const ID = Object.keys(endpointMappings)[0];
        return test.getCache(ID)
            .then((res) => res.should.eql(expectedCertList(0)))
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
