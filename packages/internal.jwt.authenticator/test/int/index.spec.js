'use strict';

const { Authenticate } = require('../../src/authenticate');
const { JWKSStore } = require('internal-jwks-store');
const should = require('should');
const jwt = require('jsonwebtoken');
const sinon = require('sinon');
const nock = require('nock');
const needle = require('needle');

describe('internal-jwt-authenticator', function(){

    const logger = {
        info: (msg) => console.log(msg),
        error: (msg) => console.error(msg),
    };

    const hostname = 'https://www.test.com';
    const serviceMappings = {
        'sage.serv1': `${hostname}/serv1`,
        'sage.serv2': 'https://www.test.com/serv2',
        'sage.serv3': 'invalid',
    };
    const validIssuers = Object.keys(serviceMappings);
    const payload = {
        exp: 100,
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
    const jwksDelay = 50;
    const JwksCachingService = new JWKSStore(serviceMappings, jwksDelay, logger);

    nock(hostname)
        .get('/serv1')
        .reply(200, {
            keys,
        });


    before(() => {
        sinon.stub(Date, 'now').returns(100000); // 100 seconds
       // cachingServiceGetCertsSpy = sinon.spy(JwksCachingService, 'getCerts');
    });

    after(() => {
        sinon.restore();
    });

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

    it('should retrieve certificate lists from jwks endpoint when authorising a new service ID', () => {
        const secret = certs[payload.kid][0];

        const token = jwt.sign( payload, secret);
        const test = new Authenticate(token, validIssuers, JwksCachingService, logger);

        return test.validate()
            .then((val) => val.should.be.true())
            .then(() => test.populateCertList())
            .then((data) => {
                data.should.be.eql(certs[payload.kid]);
            })
    });

    it('should retrieve certificate lists from cache when authorising a non-expired service ID');

});
