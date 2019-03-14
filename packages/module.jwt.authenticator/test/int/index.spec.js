'use strict';

const { Authenticate } = require('../../src/authenticate');
const { EndPointsStore } = require('@sage/bc-endpoints-store');
const should = require('should');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');
const nock = require('nock');

describe('internal-jwt-authenticator', function(){

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
    const jwksDelay = 50;
    const payload = {
        exp: (Date.now() / 1000) + jwksDelay,
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

    let JwksCachingService;
    let getCertListSpy;
    let getEndPointSpy;

    const nockcalls = nock(hostname)
        .persist()
        .get('/serv1')
        .reply(200, {
            keys,
        });


    before(() => {
        JwksCachingService = new EndPointsStore(serviceMappings, jwksDelay, logger);
        getCertListSpy = sinon.spy(JwksCachingService, 'getCertList');
        getEndPointSpy = sinon.spy(JwksCachingService, 'getEndPoint');
    });

    afterEach(() => {
        getCertListSpy.resetHistory();
        getEndPointSpy.resetHistory();
    });

    after(() => {
        JwksCachingService = null;
        sinon.restore();
    });

    describe('Validation tests', () => {
        it('should extract correct details from jwt', () => {
            const secret = certs[payload.kid][0];
            const token = jwt.sign( payload, secret);
            const test = new Authenticate(token, validIssuers, JwksCachingService, logger);

            should.strictEqual(test.kid, payload.kid);
            should.strictEqual(test.iss, payload.iss);
            should.strictEqual(test.exp, payload.exp);
        });

        it('should throw an error if invalid jwt passed in', () => {
            const token = 'invalid-token';
            should.throws(() => new Authenticate(token, validIssuers, JwksCachingService, logger), /invalidAuthToken/);
        });

        it('should reject an expired token', () => {
            const secret = certs[payload.kid][0];
            const expiredPayLoad = Object.assign({}, payload, { exp: 0});
            const token = jwt.sign( expiredPayLoad, secret);
            const test = new Authenticate(token, validIssuers, JwksCachingService, logger);

            return test.validate().should.be.rejectedWith('authTokenExpired');
        });

        it('should reject a token with an invalid issuer', () => {
            const secret = certs[payload.kid][0];
            const expiredPayLoad = Object.assign({}, payload, { iss: 'invalid'});
            const token = jwt.sign( expiredPayLoad, secret);
            const test = new Authenticate(token, validIssuers, JwksCachingService, logger);

            return test.validate().should.be.rejectedWith('authTokenIssuerInvalid');
        });

        it('should return true when calling validate on a valid token', () => {
            const secret = certs[payload.kid][0];

            const token = jwt.sign( payload, secret);
            const test = new Authenticate(token, validIssuers, JwksCachingService, logger);

            return test.validate().should.be.fulfilledWith(true);
        });
    });

    describe('endpoint tests', () => {
        it('should retrieve certificate lists from jwks endpoint when authorising a new service ID', () => {
            const secret = certs[payload.kid][1];

            const token = jwt.sign( payload, secret);
            const test = new Authenticate(token, validIssuers, JwksCachingService, logger);

            return test.validate()
                .then((val) => val.should.be.true())
                .then(() => test.checkAuthorisation())
                .then((data) => {
                    should.strictEqual(data.authorised, true);
                    getCertListSpy.calledOnce.should.be.true();
                    getEndPointSpy.calledOnce.should.be.true();
                    should.strictEqual(nockcalls.interceptors[0].interceptionCounter, 1);
                });
        });

        it('should retrieve certificate lists from cache when authorising a non-expired service ID', () => {
            const secret = certs[payload.kid][0];

            const token = jwt.sign( payload, secret);
            const test = new Authenticate(token, validIssuers, JwksCachingService, logger);

            return test.validate()
                .then((val) => val.should.be.true())
                .then(() => test.checkAuthorisation())
                .then((data) => {
                    should.strictEqual(data.authorised, true);
                    getCertListSpy.calledOnce.should.be.true();
                    getEndPointSpy.calledOnce.should.be.false();
                    should.strictEqual(nockcalls.interceptors[0].interceptionCounter, 1);
                })
        });
    });

    describe('Error capture tests', () => {
        it('should throw an error if invalid issuer', () => {
            const secret = certs[payload.kid][0];

            const newPayload = Object.assign({}, payload,  {iss: 'unknown'});
            const token = jwt.sign( newPayload, secret);
            const test = new Authenticate(token, validIssuers, JwksCachingService, logger);
            (test.checkAuthorisation()).should.be.rejectedWith(/authTokenIssuerInvalid/);
        });

        it('should throw an error if auth check fails', () => {
            const secret = certs[payload.kid][0];

            const newPayload = Object.assign({}, payload,  {kid: 'unknown'});
            const token = jwt.sign( newPayload, secret);
            const test = new Authenticate(token, validIssuers, JwksCachingService, logger);
            (test.checkAuthorisation()).should.be.rejectedWith(/AuthFailed/);
        });
    });

    describe('expired cache test', () => {

        before(() => {
            const newTime = Date.now() + (jwksDelay * 20000);
            sinon.stub(Date, 'now').returns( newTime );
        });

        after(() => {
            sinon.restore();
        });


        it('should refresh certificate lists from endpoint when authorising an expired service ID', () => {
            const secret = certs[payload.kid][0];

            const newPayload = Object.assign({}, payload,  {exp: (Date.now() / 1000) + jwksDelay * 3});
            const token = jwt.sign( newPayload, secret);
            const test = new Authenticate(token, validIssuers, JwksCachingService, logger);

            return test.validate()
                .then((val) => val.should.be.true())
                .then(() => test.checkAuthorisation())
                .then((data) => {
                    should.strictEqual(data.authorised, true);
                    getCertListSpy.calledOnce.should.be.true();
                    getEndPointSpy.calledOnce.should.be.false();

                    should.strictEqual(nockcalls.interceptors[0].interceptionCounter, 2);
                })
        })
    });
});
