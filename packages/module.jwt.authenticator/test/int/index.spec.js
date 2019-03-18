'use strict';

const { Authenticate } = require('../../src/authenticate');
const { EndpointsStore } = require('@sage/bc-endpoints-store');
const { Cache } = require('@sage/bc-data-cache');
const { refreshFn, mappingFn } = require('../../src/utils');
const should = require('should');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');
const nock = require('nock');

describe('module-jwt-authenticator', function(){

    const logger = {
        info: (msg) => console.log(msg),
        warn: (msg) => console.log(msg),
        error: (msg) => console.log(msg),
    };

    const hostname = 'https://www.testjwt.com';
    const serviceMappings = {
        'sage.serv1': `${hostname}/serv1`,
        'sage.serv2': `${hostname}/serv2`,
        'sage.serv3': 'invalid',
    };
    const validIssuers = Object.keys(serviceMappings);
    const cacheExpiry = 50;
    const payload = {
        exp: (Date.now() / 1000) + cacheExpiry,
        iss: 'sage.serv1',
        kid: 'kid1',
    };
    const keys = [
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
    ];
    const certs = {
        kid1: [
            'cert1',
            'cert2',
        ],
        kid2: [
            'cert3',
            'cert4',
        ],
    };

    let StoreService;
    let getCertListSpy;
    let getEndpointSpy;

    const nockcalls = nock(hostname)
        .persist()
        .get('/serv1')
        .reply(200, {
            keys,
        });

    before(() => {
        StoreService = new EndpointsStore({
            endpointMappings: serviceMappings,
            cacheExpiry,
            logger,
            cacheClass: Cache,
            refreshFunction: refreshFn,
            mappingFunction: mappingFn,
        });
        getCertListSpy = sinon.spy(StoreService, 'getCache');
        getEndpointSpy = sinon.spy(StoreService, 'getEndpoint');
    });

    afterEach(() => {
        getCertListSpy.resetHistory();
        getEndpointSpy.resetHistory();
    });

    after(() => {
        StoreService = null;
        sinon.restore();
    });

    describe('Validation tests', () => {
        it('should extract correct details from jwt', () => {
            const secret = certs[payload.kid][0];
            const authToken = jwt.sign( payload, secret);
            const test = new Authenticate({
                authToken,
                validIssuers,
                StoreService,
                logger,
            });

            should.strictEqual(test.kid, payload.kid);
            should.strictEqual(test.iss, payload.iss);
            should.strictEqual(test.exp, payload.exp);
        });

        it('should throw an error if invalid jwt passed in', () => {
            const authToken = 'invalid-token';
            should.throws(() => new Authenticate({
                authToken,
                validIssuers,
                StoreService,
                logger,
            }), /invalidAuthToken/);
        });

        it('should reject an expired token', () => {
            const secret = certs[payload.kid][0];
            const expiredPayLoad = Object.assign(
                {},
                payload,
                { exp: 0}
            );
            const authToken = jwt.sign( expiredPayLoad, secret);

            should.throws(() => new Authenticate({
                authToken,
                validIssuers,
                StoreService,
                logger,
            }), /authTokenExpired/);
        });

        it('should reject a token with an invalid issuer', () => {
            const secret = certs[payload.kid][0];
            const expiredPayLoad = Object.assign(
                {},
                payload,
                { iss: 'invalid'}
            );
            const authToken = jwt.sign( expiredPayLoad, secret);

            should.throws(() => new Authenticate({
                authToken,
                validIssuers,
                StoreService,
                logger,
            }), /authTokenIssuerInvalid/);
        });

        it('should return true when calling validate on a valid token', () => {
            const secret = certs[payload.kid][0];

            const authToken = jwt.sign( payload, secret);
            const test = new Authenticate({
                authToken,
                validIssuers,
                StoreService,
                logger,
            });

            test.validate().should.be.true();
        });
    });

    describe('endpoint tests', () => {
        it('should retrieve certificate lists from jwks endpoint when authorising a new service ID', () => {
            const secret = certs[payload.kid][1];

            const authToken = jwt.sign( payload, secret);
            const test = new Authenticate({
                authToken,
                validIssuers,
                StoreService,
                logger,
            });

            return test.checkAuthorisation()
                .then((data) => {
                    should.strictEqual(data.authorised, true);
                    getCertListSpy.calledOnce.should.be.true();
                    getEndpointSpy.calledOnce.should.be.true();
                    should.strictEqual(nockcalls.interceptors[0].interceptionCounter, 1);
                });
        });

        it('should retrieve certificate lists from cache when authorising a non-expired service ID', () => {
            const secret = certs[payload.kid][0];

            const authToken = jwt.sign( payload, secret);
            const test = new Authenticate({
                authToken,
                validIssuers,
                StoreService,
                logger,
            });

            return test.checkAuthorisation()
                .then((data) => {
                    should.strictEqual(data.authorised, true);
                    getCertListSpy.calledOnce.should.be.true();
                    getEndpointSpy.calledOnce.should.be.false();
                    should.strictEqual(nockcalls.interceptors[0].interceptionCounter, 1);
                })
        });
    });

    describe('Error capture tests', () => {
        it('should throw an error if auth check fails', () => {
            const secret = certs[payload.kid][0];

            const newPayload = Object.assign(
                {},
                payload, 
                { kid: 'unknown' }
            );

            const authToken = jwt.sign( newPayload, secret );
            const test = new Authenticate({
                authToken,
                validIssuers,
                StoreService,
                logger,
            });
            (test.checkAuthorisation()).should.be.rejectedWith(/AuthFailed/);
        });
    });

    describe('expired cache test', () => {

        before(() => {
            const newTime = Date.now() + (cacheExpiry * 20000);
            sinon.stub(Date, 'now').returns( newTime );
        });

        after(() => {
            sinon.restore();
        });


        it('should refresh certificate lists from endpoint when authorising an expired service ID', () => {
            const secret = certs[payload.kid][0];

            const newPayload = Object.assign(
                {},
                payload, 
                { exp: (Date.now() / 1000) + cacheExpiry * 3 }
            );
            const authToken = jwt.sign( newPayload, secret );
            const test = new Authenticate({
                authToken,
                validIssuers,
                StoreService,
                logger,
            });

            return test.checkAuthorisation()
                .then((data) => {
                    should.strictEqual(data.authorised, true);
                    getCertListSpy.calledOnce.should.be.true();
                    getEndpointSpy.calledOnce.should.be.false();

                    should.strictEqual(nockcalls.interceptors[0].interceptionCounter, 2);
                })
        })
    });
});
