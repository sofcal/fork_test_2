const Promise = require('bluebird');
const sinon = require('sinon');
const _ = require('underscore');
const cloudIdAuthenticatorLambdaSpec = require('../../lib/CloudIdAuthenticatorLambda');
const should = require('should');
const nock = require('nock');
const needle = require('needle');

describe('lambda-CloudIdAuthentication.Lambda', function () {

    const useNock = false;

    const doNothing = () => {};
    const env = 'local';
    const region = 'eu-west-1';
    const authBody = {
        grant_type: 'client_credentials',
        client_id: 'uou47P8CM1tQXhUIWj3RKpremgGCormq',
        client_secret: 'KBmlO_0oBP0MkyJ7G9Q5DIAocdGndF1hoD-viqzw5wKhj5RXTtC0ns-ltQ3f027i',
        audience: 'a6e78e2/paymentsOut'
    };
    const request = Promise.promisifyAll(needle);

    let cloudIdAuthenticatorLambda;
    let sandbox;
    let logger = {
        info: doNothing,
        err: doNothing
    };
    let event = {
        logger: logger
    };
    let context;
    let callback;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    let config;

    beforeEach(() => {
        callback = sinon.spy();
        if (useNock) {
            nock('https://id-shadow.sage.com')
                .get('/.well-known/jwks.json')
                .reply(200, '{\n' +
                    '    "keys": [\n' +
                    '        {\n' +
                    '            "alg": "RS256",\n' +
                    '            "kty": "RSA",\n' +
                    '            "use": "sig",\n' +
                    '            "x5c": [\n' +
                    '                "MIIDEzCCAfugAwIBAgIJRMSEzrALnZBsMA0GCSqGSIb3DQEBCwUAMCcxJTAjBgNVBAMTHHNhZ2UtY2lkLXNoYWRvdy5ldS5hdXRoMC5jb20wHhcNMTgwNzAyMTUzMjM3WhcNMzIwMzEwMTUzMjM3WjAnMSUwIwYDVQQDExxzYWdlLWNpZC1zaGFkb3cuZXUuYXV0aDAuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4Uw7GDbF9PNALrJcbmBrVhX5Z8e5Khc5L6sVIAaru49Hz5VDBRkIY/Ot+bWwitP7nYGnTnZ1Y6H5Dm2uqFiR+th1ZIWx5ZYIres+DyNFVvf/xSIK6J5e1HDnvSFKYPiDZb44zN1YwuOfahhrmREj9kbL3r9CLz6GCWsFjQGJioGF6rkr618SHKvoTiGSKDPgSFhajnDBRJo0JoNU8Zf51xMVqacK/fkHGsxhuJPp+kM51zrDgZhu2LkLVqQDa7YQoEYLu1l6WLkwB/Y9bjuxppIBGYJ6cAGnCcd8WR9JQcdF0VtB66P8k9bJ84qaZIiPaZwxekiky51loJMtKIKj3QIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTIB4SBQqerQJwrukzCTJVqXLfegTAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBAD+6Fr1oVVR5gzCslKmnFzF0X97x2Hs+auq7yD8Z8eulOyfgrsiPAXRf78IKdCNEBKYYbj7i82FYtyXqZ5RwAR97f+sDB1CMxYNHC6ZBJXL+mnL9YSHu7EHNKcUavdPgsQpCnBXuCVsqhBEtp6ZYXce7IckfuUgA3WhO6ie2lEXAbX7kl1kF6XNWptLo6+Jt015TPVXbrUk2fLUss1zSxuDRo8w77bQmPQhR1YOR6j2GuzSXxJyrRZ2bXixfzVROa/yeUeyUCsfvahVc9Bm/hfFbICDcxs8hcAytXJ6XJVm6gY013qVYUalqhmMU8mMt1exUJLaqp8G4Pz9vwpjKnwQ="\n' +
                    '            ],\n' +
                    '            "n": "4Uw7GDbF9PNALrJcbmBrVhX5Z8e5Khc5L6sVIAaru49Hz5VDBRkIY_Ot-bWwitP7nYGnTnZ1Y6H5Dm2uqFiR-th1ZIWx5ZYIres-DyNFVvf_xSIK6J5e1HDnvSFKYPiDZb44zN1YwuOfahhrmREj9kbL3r9CLz6GCWsFjQGJioGF6rkr618SHKvoTiGSKDPgSFhajnDBRJo0JoNU8Zf51xMVqacK_fkHGsxhuJPp-kM51zrDgZhu2LkLVqQDa7YQoEYLu1l6WLkwB_Y9bjuxppIBGYJ6cAGnCcd8WR9JQcdF0VtB66P8k9bJ84qaZIiPaZwxekiky51loJMtKIKj3Q",\n' +
                    '            "e": "AQAB",\n' +
                    '            "kid": "RUQyQ0M0MkNBNkRBNTlDMzZCNzUxOUU2RDY5NDlBNUQzOERBMDAwMA",\n' +
                    '            "x5t": "RUQyQ0M0MkNBNkRBNTlDMzZCNzUxOUU2RDY5NDlBNUQzOERBMDAwMA"\n' +
                    '        }\n' +
                    '    ]\n' +
                    '}');
        }
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should return properties from a token when provide validClients', () => {
        return request.postAsync('https://id-shadow.sage.com/oauth/token', authBody)
            .then((response) => {
                return response.body.access_token;
            })
            .then((token) => {
                config = {
                    Environment: env,
                    AWS_REGION: region,
                    validIssuer: ['https://id-shadow.sage.com/'],
                    validClients: ['uou47P8CM1tQXhUIWj3RKpremgGCormq', 'test2'],
                    validAudiences: ['a6e78e2/paymentsOut', 'test3'],
                    jwksCache: true,
                    jwksRateLimit: true,
                    jwksRequestsPerMinute: 10
                };
                event = {AWS_REGION: region, env, headers: {Authorization: 'Bearer ' + token}};
                cloudIdAuthenticatorLambda = cloudIdAuthenticatorLambdaSpec.Create({config});
                return cloudIdAuthenticatorLambda.run(event, context, callback)
            })
            .then(() => {
                should(callback.callCount).eql(1);
                const context = callback.args[0][1].context;
                const statements = callback.args[0][1].policyDocument.Statement;
                should(context.aud).eql('a6e78e2/paymentsOut');
                should(context.azp).eql('uou47P8CM1tQXhUIWj3RKpremgGCormq');
                should(context.iss).eql('https://id-shadow.sage.com/');
                should(context.scope).eql('webhook');
                should(statements.length).eql(1);
                should(statements[0].Action).eql('*');
                should(statements[0].Effect).eql('Allow');
                should(statements[0].Resource).eql('*');
            })
            .catch((err) => {
                console.log(err);
            });
    });

    it('should return properties from a token when not provide validClients', () => {
        return request.postAsync('https://id-shadow.sage.com/oauth/token', authBody)
            .then((response) => {
                return response.body.access_token;
            })
            .then((token) => {
                config = {
                    Environment: env,
                    AWS_REGION: region,
                    validIssuer: ['https://id-shadow.sage.com/'],
                    validAudiences: ['a6e78e2/paymentsOut', 'test3'],
                    jwksCache: true,
                    jwksRateLimit: true,
                    jwksRequestsPerMinute: 10
                };
                event = {AWS_REGION: region, env, headers: {Authorization: 'Bearer ' + token}};
                cloudIdAuthenticatorLambda = cloudIdAuthenticatorLambdaSpec.Create({config});
                return cloudIdAuthenticatorLambda.run(event, context, callback)
            })
            .then(() => {
                should(callback.callCount).eql(1);
                const context = callback.args[0][1].context;
                const statements = callback.args[0][1].policyDocument.Statement;
                should(context.aud).eql('a6e78e2/paymentsOut');
                should(context.azp).eql('uou47P8CM1tQXhUIWj3RKpremgGCormq');
                should(context.iss).eql('https://id-shadow.sage.com/');
                should(context.scope).eql('webhook');
                should(statements.length).eql(1);
                should(statements[0].Action).eql('*');
                should(statements[0].Effect).eql('Allow');
                should(statements[0].Resource).eql('*');
            })
            .catch((err) => {
                console.log(err);
            });
    });

    it('should fail if invalid issuer', () => {
        return request.postAsync('https://id-shadow.sage.com/oauth/token', authBody)
            .then((response) => {
                return response.body.access_token;
            })
            .then((token) => {
                config = {
                    Environment: env,
                    AWS_REGION: region,
                    validIssuer: ['invalid'],
                    validClients: ['uou47P8CM1tQXhUIWj3RKpremgGCormq', 'test2'],
                    validAudiences: ['a6e78e2/paymentsOut', 'test3'],
                    jwksCache: true,
                    jwksRateLimit: true,
                    jwksRequestsPerMinute: 10
                };
                event = {AWS_REGION: region, env, headers: {Authorization: 'Bearer ' + token}};

                cloudIdAuthenticatorLambda = cloudIdAuthenticatorLambdaSpec.Create({config});

                return cloudIdAuthenticatorLambda.run(event, context, callback)
            })
            .then(() => {
                should(callback.callCount).eql(1);
                const args1 = callback.args;
                const args2 = args1[0];
                should(args2[0]).eql('Unauthorized');
            })
            .catch((err) => {
                console.log(err);
            });
    });

    it('should fail if invalid client', () => {
        return request.postAsync('https://id-shadow.sage.com/oauth/token', authBody)
            .then((response) => {
                return response.body.access_token;
            })
            .then((token) => {
                config = {
                    Environment: env,
                    AWS_REGION: region,
                    validIssuer: ['https://id-shadow.sage.com/'],
                    validClients: ['invalidClient', 'test2'],
                    validAudiences: ['a6e78e2/paymentsOut', 'test3'],
                    jwksCache: true,
                    jwksRateLimit: true,
                    jwksRequestsPerMinute: 10
                };
                event = {AWS_REGION: region, env, headers: {Authorization: 'Bearer ' + token}};

                cloudIdAuthenticatorLambda = cloudIdAuthenticatorLambdaSpec.Create({config});
                return cloudIdAuthenticatorLambda.run(event, context, callback)
            })
            .then(() => {
                should(callback.callCount).eql(1);
                const args1 = callback.args;
                const args2 = args1[0];
                should(args2[0]).eql('Unauthorized');
            })
            .catch((err) => {
                console.log(err);
            });
    });

    it('should fail if invalid audience', () => {
        return request.postAsync('https://id-shadow.sage.com/oauth/token', authBody)
            .then((response) => {
                return response.body.access_token;
            })
            .then((token) => {
                config = {
                    Environment: env,
                    AWS_REGION: region,
                    validIssuer: ['https://id-shadow.sage.com/'],
                    validClients: ['uou47P8CM1tQXhUIWj3RKpremgGCormq', 'test2'],
                    validAudiences: ['invalid', 'test3'],
                    jwksCache: true,
                    jwksRateLimit: true,
                    jwksRequestsPerMinute: 10
                };
                event = {AWS_REGION: region, env, headers: {Authorization: 'Bearer ' + token}};

                cloudIdAuthenticatorLambda = cloudIdAuthenticatorLambdaSpec.Create({config});

                return cloudIdAuthenticatorLambda.run(event, context, callback)
            })
            .then(() => {
                should(callback.callCount).eql(1);
                const args1 = callback.args;
                const args2 = args1[0];
                should(args2[0]).eql('Unauthorized');
            })
            .catch((err) => {
                console.log(err);
            });
    })
});
