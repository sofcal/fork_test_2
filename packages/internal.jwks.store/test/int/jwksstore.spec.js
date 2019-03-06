const should = require('should');
const sinon = require('sinon');
const nock = require('nock');
const needle = require('needle');
const { JWKSStore } = require('../../src/jwksstore');
const { JWKSCache } = require('../../src/jwkscache');

describe('internal-jwks-store', function(){
    const serviceMappings = {
        serv1: 'https://www.test.com/serv1',
        serv2: 'https://www.test.com/serv2',
        serv3: 'invalid',
    };
    const jwksDelay = 10;
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

    const test = new JWKSStore(serviceMappings, jwksDelay);

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
        cacheBuildSpy = sinon.spy(JWKSCache.prototype, 'buildCache');
    });

    after(() => {
        nock.restore();
    });

    afterEach(() => {
       cacheBuildSpy.resetHistory();
    });

    it('should allow new instance of JWKSStore to be created', () => {
         test.should.be.instanceOf(JWKSStore);
    });

    it('should retrieve and return keys from endpoint', () => {
        dateStub.returns(200000); // 200 seconds
        return test.getCertList(Object.keys(serviceMappings)[0])
            .then((res) => res.should.eql(expectedCertList(0)))
            .then(() => should.strictEqual(cacheBuildSpy.called, true));
    });

    it('should return keys from cache when cache not expired', () => {
        dateStub.returns(100000); // 100 seconds
        return test.getCertList(Object.keys(serviceMappings)[0])
            .then((res) => res.should.eql(expectedCertList(0)))
            .then(() => should.strictEqual(cacheBuildSpy.called, false));
    });

    it('should refresh keys from endpoint when cache expired', () => {
        dateStub.returns(300000 + (jwksDelay * 1000 * 2));
        const serviceID = Object.keys(serviceMappings)[0];
        return test.getCertList(serviceID)
            .then((res) => res.should.eql(expectedCertList(0)))
            .then(() => should.strictEqual(cacheBuildSpy.called, true));
    });

    it('should reject when service endpoint not known', () => {
        const serviceID = 'unknown';
        return test.getCertList(serviceID).should.be.rejectedWith('authTokenIssuerInvalid');
    });

    it('should reject when invalid service endpoint', () => {
        const serviceID = 'serv3';
        return test.getCertList(serviceID).should.be.rejectedWith(/getaddrinfo ENOTFOUND invalid/);
    });

});
