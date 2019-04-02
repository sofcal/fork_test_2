'use strict';

const { JwtAuthenticator } = require('../../lib/index');
const { EndpointStore } = require('@sage/sfab-s2s-jwt-endpoint-store');
const { Cache } = require('@sage/sfab-s2s-jwt-cache');
const { Jwks } = require('@sage/sfab-s2s-jwt-jwks');
const should = require('should');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');
const nock = require('nock');
const keypair = require('keypair');

const { public: pub1, private: priv1 } = keypair();
const { public: pub2, private: priv2 } = keypair();

const algorithm = 'RS256';

describe('@sage/sfab-s2s-jwt-authenticator.index', function(){

    const logger = {
        info: (msg) => console.log(msg),
        warn: (msg) => console.log(msg),
        error: (msg) => console.log(msg),
    };

    const hostname = 'https://www.testjwt.com';
    const endpointMappings = {
        'sage.serv1': `${hostname}/serv1`,
        'sage.serv2': `${hostname}/serv2`,
        'sage.serv3': 'invalid',
    };
    const validIssuers = Object.keys(endpointMappings);
    const refreshDelay = 100;
    const payload = {
        exp: (Date.now() / 1000) + refreshDelay,
        iss: 'sage.serv1',
        kid: 'kid1',
        customClaim: 'sage',
    };

    const keys = [
        {
            kid: 'kid1',
            x5c: [
                Jwks.ConvertPemToX5C(pub1),
            ]
        },
        {
            kid: 'kid2',
            x5c: [
                Jwks.ConvertPemToX5C(pub2),
            ]
        }
    ];
    const certs = {
        kid1: [
            priv1,
        ],
        kid2: [
            priv2,
        ],
    };

    let storeService;
    let getCacheSpy;
    let getEndpointSpy;

    const nockcalls = nock(hostname)
        .persist()
        .get('/serv1')
        .reply(200, {
            keys,
        })
        .get('/serv2')
        .reply(200, {});
    let nockCallCount = 0;

    before(() => {
        storeService = new EndpointStore(
            {
                endpointMappings,
                refreshDelay,
                cacheClass: Cache,
            },
            { logger }
        );
        getCacheSpy = sinon.spy(storeService, 'getCache');
        getEndpointSpy = sinon.spy(storeService, 'getEndpoint');
    });

    afterEach(() => {
        getCacheSpy.resetHistory();
        getEndpointSpy.resetHistory();
    });

    after(() => {
        storeService = null;
        sinon.restore();
    });

    describe('Constructor tests', () => {
        it('should be able to create new authenticate object', () => {
            const test = new JwtAuthenticator({
                storeService,
            }, {logger});

            test.should.be.Object();
            test.should.be.instanceof(JwtAuthenticator);
        });

        it('should default logger when not passed in', () => {
            const test = new JwtAuthenticator({
                storeService,
            });
    
            (test.logger).should.be.a.Object();
            (test.logger).should.have.properties(['info', 'warn', 'error']);
            should.equal(test.logger.error(), undefined);
        });

        it('should be able to create new authenticate object using Authenticate.create', () => {
            const test = JwtAuthenticator.Create({
                storeService,
            }, {logger});

            test.should.be.Object();
            test.should.be.instanceof(JwtAuthenticator);
        });
    });

    describe('Check authorisation - Early exit tests', () => {
        it('should reject if invalid jwt passed in', () => {
            const test = new JwtAuthenticator({
                storeService,
            }, {logger});
            const authToken = 'invalid-token';

            return (test.checkAuthorisation(authToken)).should.be.rejectedWith(/invalidAuthToken/);
        });

        it('should reject an expired token', () => {
            const test = new JwtAuthenticator({
                storeService,
            }, {logger});
            const secret = certs[payload.kid][0];
            const expiredPayLoad = Object.assign(
                {},
                payload,
                { exp: 0}
            );
            const authToken = jwt.sign( expiredPayLoad, secret);

            return (test.checkAuthorisation(authToken)).should.be.rejectedWith(/authTokenExpired/);
        });

        it('should reject a token with an invalid issuer', () => {
            const test = new JwtAuthenticator({
                storeService,
            }, {logger});
            const secret = certs[payload.kid][0];
            const invalidPayload = Object.assign(
                {},
                payload,
                { iss: 'invalid'}
            );
            const authToken = jwt.sign( invalidPayload, secret);

            return (test.checkAuthorisation(authToken)).should.be.rejectedWith(/authTokenIssuerInvalid/);
        });

        it('should reject an unsigned token', () => {
            const test = new JwtAuthenticator({
                storeService,
            }, {logger});
            const authToken = jwt.sign( payload, null, { algorithm: 'none'});

            return (test.checkAuthorisation(authToken)).should.be.rejectedWith(/invalidAuthToken/);
        });
    });

    describe('endpoint fetch tests', () => {
        it('should retrieve cert lists and authorise when validating a new service ID', () => {
            const secret = certs[payload.kid][0];       

            const authToken = jwt.sign( payload, secret, { algorithm });
            const test = new JwtAuthenticator({
                storeService,
            }, {logger});

            return test.checkAuthorisation(authToken)
                .then((data) => {
                    nockCallCount += 1;
                    should.strictEqual(data.authorised, true);
                    (data.claims).should.have.property('customClaim');
                    getCacheSpy.calledTwice.should.be.true(); // should be called twice - once non-forced, then again with force flag
                    getEndpointSpy.calledOnce.should.be.true(); // call getEndPoint when building new cache entry
                    should.strictEqual(nockcalls.interceptors[0].interceptionCounter, nockCallCount); // one call out to endpoint
                });
        });

        it('should retrieve cached cert list and authorise when validating an existing service ID', () => {
            const secret = certs[payload.kid][0];

            const authToken = jwt.sign( payload, secret, { algorithm } );
            const test = new JwtAuthenticator({
                storeService,
            }, {logger});

            return test.checkAuthorisation(authToken)
                .then((data) => {
                    should.strictEqual(data.authorised, true);
                    getCacheSpy.calledOnce.should.be.true(); // should be called once - kid should already be cached
                    getEndpointSpy.notCalled.should.be.true(); // shouldn't call endpoint when already cached
                    should.strictEqual(nockcalls.interceptors[0].interceptionCounter, nockCallCount); // zero calls out to endpoint
                })
        });
    });

    describe('Error capture tests', () => {
        it('Constructor errors - invalid store service', () => {
            should.throws(() => new JwtAuthenticator({
                storeService: 'storeService',
            }, {logger}), /^Error: Invalid argument passed: storeService$/);
        });

        it('Constructor errors - invalid logger', () => {
            should.throws(() => new JwtAuthenticator({
                storeService,
            }, {logger: {}}), /^Error: Invalid argument passed: Logger not valid$/);
        });


        it('endpoint read errors', () => {
            const secret = certs[payload.kid][0];       

            const newPayload = Object.assign(
                {},
                payload, 
                { iss: 'sage.serv3' }
            );
            const authToken = jwt.sign( newPayload, secret, { algorithm });
            const test = new JwtAuthenticator({
                storeService,
            }, {logger});

            return test.checkAuthorisation(authToken).should.be.rejectedWith(/Fetch endpoint error: getaddrinfo ENOTFOUND invalid invalid/); // auth fails 
        });
    });

    describe('refresh delay test', () => {
        const newPayload = Object.assign(
            {},
            payload,
            {kid: 'unknown'}
        );

        it('should not refresh cert lists from endpoint when unknown kid but within refresh delay limit', () => {
            const secret = certs[payload.kid][0];

            const authToken = jwt.sign( newPayload, secret, { algorithm } );
            const newStoreService = new EndpointStore(
                {
                    endpointMappings,
                    refreshDelay,
                    cacheClass: Cache,
                },
                { logger }
            );
            getCacheSpy = sinon.spy(newStoreService, 'getCache');
            getEndpointSpy = sinon.spy(newStoreService, 'getEndpoint');
            const test = new JwtAuthenticator({
                storeService: newStoreService,
            }, {logger});

            const tokenCerts = test.validateToken(authToken)

            return test.getCertKeys(tokenCerts) //force population of cache
                .then(() => {nockCallCount += 1})
                .then(() => test.checkAuthorisation(authToken))
                .catch((err) => {
                    should.strictEqual(err.message, 'AuthFailed'); // auth fails 
                    getCacheSpy.callCount.should.eql(4); // should be called 4 times - twice for first test.getCertKeys call then twice again in test.checkAuthorisation
                    getEndpointSpy.calledOnce.should.be.true(); // should only call getendpoint on first build of cache
                    should.strictEqual(nockcalls.interceptors[0].interceptionCounter, nockCallCount); // single call out to endpoint
                })
        })

        it('should refresh cert lists from endpoint when unknown kid and outside of refresh delay limit', () => {
            const secret = certs[payload.kid][0];

            const authToken = jwt.sign( newPayload, secret, { algorithm } );
            const newStoreService = new EndpointStore(
                {
                    endpointMappings,
                    refreshDelay: -1,
                    cacheClass: Cache,
                },
                { logger }
            );
            getCacheSpy = sinon.spy(newStoreService, 'getCache');
            getEndpointSpy = sinon.spy(newStoreService, 'getEndpoint');
            const test = new JwtAuthenticator({
                storeService: newStoreService,
            }, {logger});

            const tokenCerts = test.validateToken(authToken)

            return test.getCertKeys(tokenCerts) //force population of cache
                .then(() => {nockCallCount += 1}) // first call from test.getCertKeys 
                .then(() => test.checkAuthorisation(authToken))
                .catch((err) => {
                    nockCallCount += 1; // second call from test.checkAuthorisation
                    should.strictEqual(err.message, 'AuthFailed'); // auth fails 
                    getCacheSpy.callCount.should.eql(4); // should be called 4 times - twice for first test.getCertKeys call then again in test.checkAuthorisation
                    getEndpointSpy.calledOnce.should.be.true(); // should only call getendpoint on first build of cache
                    should.strictEqual(nockcalls.interceptors[0].interceptionCounter, nockCallCount); // two calls out to endpoint
                })
        })
    });

    describe('Authorisation tests', () => {
        it('should authorise a valid jwt, and return the custom claims', () => {
            const secret = certs[payload.kid][0];       

            const authToken = jwt.sign( payload, secret, { algorithm });
            const test = new JwtAuthenticator({
                storeService,
            }, {logger});

            return test.checkAuthorisation(authToken)
                .then((data) => {
                    nockCallCount += 1;
                    should.strictEqual(data.authorised, true);
                    (data.claims).should.have.property('customClaim');
                    (data.claims).should.not.have.property('exp');
                    should.strictEqual(data.claims.customClaim, payload.customClaim);
                });         
        });

        it('should fail authorisation if valid certificate not found for kid', () => {
            const secret = certs['kid2'][0];       

            const authToken = jwt.sign( payload, secret, { algorithm });
            const test = new JwtAuthenticator({
                storeService,
            }, {logger});

            return test.checkAuthorisation(authToken)
                .catch((err) => {
                    should.strictEqual(err.message, 'AuthFailed'); // auth fails 
                })
        });

        it('should fail authorisation if kid not found for issuer', () => {
            const secret = certs[payload.kid][0];       

            const newPayload = Object.assign(
                {},
                payload, 
                { iss: 'sage.serv2' }
            );
            const authToken = jwt.sign( newPayload, secret, { algorithm });
            const test = new JwtAuthenticator({
                storeService,
            }, {logger});

            return test.checkAuthorisation(authToken)
                .catch((err) => {
                    should.strictEqual(err.message, 'AuthFailed'); // auth fails 
                })
        });
    });
});
