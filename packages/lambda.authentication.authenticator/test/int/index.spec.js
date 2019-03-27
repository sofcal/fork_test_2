const JwtAuthenticatorLambda = require('../../lib/JwtAuthenticatorLambda');

const { Jwks } = require('@sage/sfab-s2s-jwt-jwks');

const should = require('should');
const keypair = require('keypair');
const nock = require('nock');
const jwt = require('jsonwebtoken');

const { public: pub1, private: priv1 } = keypair();
const { public: pub2, private: priv2 } = keypair();

const algorithm = 'RS256';

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
const certs = {
    kid1: [
        priv1,
    ],
    kid2: [
        priv2,
    ],
};
const validIssuers = Object.keys(serviceMappings);
const refreshDelay = 100;
const payload = {
    exp: (Date.now() / 1000) + refreshDelay,
    iss: 'sage.serv1',
    kid: 'kid1',
    customClaim: 'sage',
};
const unknownKidPayload = Object.assign({} , payload, {kid: 'unknown'})
const expiredPayload = Object.assign({} , payload, {exp: 0})
const unknownIssPayload = Object.assign({} , payload, {iss: 'unknown'})
const secret1 = certs[payload.kid][0];       
const secret2 = certs['kid2'][0];       

const token1 = jwt.sign( payload, secret1, { algorithm });
const token2 = jwt.sign( payload, secret2, { algorithm });
const token3 = jwt.sign( unknownKidPayload, secret2, { algorithm });
const token4 = jwt.sign( expiredPayload, secret1, { algorithm });
const token5 = jwt.sign( unknownIssPayload, secret1, { algorithm });
const bearerToken = token => `Bearer ${token}`;

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

describe('jwt-authenticator', function(){
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

    const config = {
        cacheExpiry: -1,
        refreshDelay: 100,
        serviceMappings: JSON.stringify(serviceMappings)
    }

    describe('Set up errors', () => {
        const authorizationToken = bearerToken(token1);
        describe('Validate tests', () => {
            it('should return unauthorised when creating new instance with no config', () => {
                const headers = {}
                const event = { authorizationToken, logger, headers}
                const test = JwtAuthenticatorLambda.Create( { config: {} } )
                let err, result;
                const callback = (...response) => [err,result] = response;
                return test.run(event, {}, callback)
                    .then(() => {
                        should.not.exist(result);
                        should.equal(err, 'Unauthorized');
                    })
            });
    
            it('should return unauthorised if no auth token passed in event', () => {
                const headers = {}
                const event = {logger, headers}
                const test = JwtAuthenticatorLambda.Create( {config} )
                let err, result;
                const callback = (...response) => [err,result] = response;
                return test.run(event, {}, callback)
                    .then(() => {
                        should.not.exist(result);
                        should.equal(err, 'Unauthorized');
                    })
            });
    
            it('should return unauthorised if invalid auth token passed in event', () => {
                const headers = {}
                const event = { authorizationToken: 'invalid', logger, headers }
                const test = JwtAuthenticatorLambda.Create( {config} )
                let err, result;
                const callback = (...response) => [err,result] = response;
                return test.run(event, {}, callback)
                    .then(() => {
                        should.not.exist(result);
                        should.equal(err, 'Unauthorized');
                    })
            });
    
            it('should return unauthorised when creating new instance with no cacheExpiry config', () => {
                const invalidConfig = {
                    refreshDelay: 100,
                    serviceMappings: JSON.stringify(serviceMappings)
                }
                const headers = {}
                const event = { authorizationToken , logger, headers}
                const test = JwtAuthenticatorLambda.Create( {config: invalidConfig} )
                let err, result;
                const callback = (...response) => [err,result] = response;
                return test.run(event, {}, callback)
                    .then(() => {
                        should.not.exist(result);
                        should.equal(err, 'Unauthorized');
                    })
            });
    
            it('should return unauthorised when creating new instance with no serviceMappings config', () => {
                const invalidConfig = {
                    refreshDelay: 100,
                    cacheExpiry: -1,
                }
                const headers = {}
                const event = { authorizationToken , logger, headers}
                const test = JwtAuthenticatorLambda.Create( {config: invalidConfig} )
                let err, result;
                const callback = (...response) => [err,result] = response;
                return test.run(event, {}, callback)
                    .then(() => {
                        should.not.exist(result);
                        should.equal(err, 'Unauthorized');
                    })
            });
        })

        describe('Init tests', () => {
            it('Should return unauthorised if serviceMappings cannot be parsed', () => {
                const invalidConfig = {
                    refreshDelay: 100,
                    cacheExpiry: -1,
                    serviceMappings: 'test'
                }
                const headers = {}
                const event = { authorizationToken , logger, headers}
                const test = JwtAuthenticatorLambda.Create( {config: invalidConfig} )
                let err, result;
                const callback = (...response) => [err,result] = response;
                return test.run(event, {}, callback)
                    .then(() => {
                        should.not.exist(result);
                        should.equal(err, 'Unauthorized');
                    })
            });

            it('Should return unauthorised if invalid EndpointStore refresh delay', () => {
                const invalidConfig = {
                    refreshDelay: 'invalid',
                    cacheExpiry: -1,
                    serviceMappings: 'test'
                }
                const headers = {}
                const event = { authorizationToken , logger, headers}
                const test = JwtAuthenticatorLambda.Create( {config: invalidConfig} )
                let err, result;
                const callback = (...response) => [err,result] = response;
                return test.run(event, {}, callback)
                    .then(() => {
                        should.not.exist(result);
                        should.equal(err, 'Unauthorized');
                    })
            });
        })
    })

    describe('Passing auth tests', () => {
        const test = JwtAuthenticatorLambda.Create( {config} )
        const headers = {
            test: true,
            ['x-forwarded-for']: 'jwt-authenticator'
        }
        
        const authorizationToken = bearerToken(token1);

        const event = { authorizationToken , logger, headers}
            
        it('should return correct details for authorised request', () => {
            let err, result;
            const callback = (...response) => [err,result] = response;
            return test.run(event, {}, callback)
                .then(() => {
                    nockCallCount += 1;
                    should.not.exist(err);
                    result.should.properties('policyDocument', 'context');
                    should.equal(result.context.iss, payload.iss);
                    should.equal(result.context.xForwardedFor, 'jwt-authenticator');
                    should.equal(result.context.customClaim, payload.customClaim);
                    should.equal(result.context.token, token1);
                    should.strictEqual(nockcalls.interceptors[0].interceptionCounter, nockCallCount); // one call out to endpoint
                })
        })

        it('should return correct details from cache for repeated authorised request', () => {
            let err, result;
            const callback = (...response) => [err,result] = response;
            return test.run(event, {}, callback)
                .then(() => {
                    should.not.exist(err);
                    result.should.properties('policyDocument', 'context');
                    should.equal(result.context.iss, payload.iss);
                    should.equal(result.context.xForwardedFor, 'jwt-authenticator');
                    should.equal(result.context.customClaim, payload.customClaim);
                    should.equal(result.context.token, token1);
                    should.strictEqual(nockcalls.interceptors[0].interceptionCounter, nockCallCount); // no extra calls out to endpoint
                })
        })
    });

    describe('Failed auth test', () => {
        const noRefreshConfig = Object.assign( {} , config, {refreshDelay: 5184000})
        const test = JwtAuthenticatorLambda.Create( {config: noRefreshConfig} )
        const headers = {
            test: true,
            ['x-forwarded-for']: 'jwt-authenticator'
        }
        
        it('should fail authorisation when jwt expired', () => {
            const authorizationToken = bearerToken(token4);
            
            const event = { authorizationToken , logger, headers}
            let err, result;
            const callback = (...response) => [err,result] = response;
            return test.run(event, {}, callback)
                .then(() => {
                    should.not.exist(result);
                    should.equal(err, 'Unauthorized');
                    should.strictEqual(nockcalls.interceptors[0].interceptionCounter, nockCallCount);
                })
        })
        
        it('should fail authorisation when iss not in service mappings', () => {
            const authorizationToken = bearerToken(token5);
            
            const event = { authorizationToken , logger, headers}
            let err, result;
            const callback = (...response) => [err,result] = response;
            return test.run(event, {}, callback)
                .then(() => {
                    should.not.exist(result);
                    should.equal(err, 'Unauthorized');
                    should.strictEqual(nockcalls.interceptors[0].interceptionCounter, nockCallCount);
                })
        })
        
        it('should fail authorisation when no matching certificate found', () => {
            const authorizationToken = bearerToken(token2);
            
            const event = { authorizationToken , logger, headers}
            let err, result;
            const callback = (...response) => [err,result] = response;
            return test.run(event, {}, callback)
                .then(() => {
                    nockCallCount += 1;
                    should.not.exist(result);
                    should.equal(err, 'Unauthorized');
                    should.strictEqual(nockcalls.interceptors[0].interceptionCounter, nockCallCount);
                })
        })
        
        it('should not call jwks endpoint for a new kid if within refresh delay limit', () => {
            const authorizationToken = bearerToken(token3);
            
            const event = { authorizationToken , logger, headers}
            let err, result;
            const callback = (...response) => [err,result] = response;
            return test.run(event, {}, callback)
                .then(() => {
                    should.not.exist(result);
                    should.equal(err, 'Unauthorized');
                    should.strictEqual(nockcalls.interceptors[0].interceptionCounter, nockCallCount);
                })
        })
    })
});
