const sinon = require('sinon');
const _ = require('underscore');
const JwksEndpoint = require('../../src/JwksEndpoint');
const JwksCache = require('../../src/JwksCache');
const should = require('should');

describe('jwks-endpoint', function() {

    const errFunc = () => {
        throw new Error('should be stubbed')
    };

    const PARAMSTORE_DATA = {
        '/local/accessToken.primary.publicKey': 'testPrimaryPublicKey',
        '/local/accessToken.secondary.publicKey': 'testSecondaryPublicKey'
    };

    const GENERATED_DATA_WITH_SALT = {
        keys: [{
            kty: 'RSA',
            alg: 'RS256',
            use: 'sig',
            kid: '42cb21d25615431717ae051904408efc7fbcf5eb487486991c352dfd5813dcb5',
            x5c: [ 'testPrimaryPublicKey' ]
        }, {
            kty: 'RSA',
            alg: 'RS256',
            use: 'sig',
            kid: '8b9b57be74954159eccd277964f7fb5b36f1d6376714f69fa218e9181f204643',
            x5c: [ 'testSecondaryPublicKey' ]
        }]
    };

    const GENERATED_DATA = {
        keys: [{
            kty: 'RSA',
            alg: 'RS256',
            use: 'sig',
            kid: '2b5d70f42a52651e16e2b95c374e2a49fe818b143bd3db9a55f91aceb088ed12',
            x5c: [ 'testPrimaryPublicKey' ]
        }, {
            kty: 'RSA',
            alg: 'RS256',
            use: 'sig',
            kid: '64d90950700000ed9a22c13f1d4b6ef8e7b37c866564b5f310d353a91be04495',
            x5c: [ 'testSecondaryPublicKey' ]
        }]
    };

    const ENV = 'local';
    const REGION = 'eu-west-1';

    let sandbox;
    let config;
    let event;
    let callback;
    let jwks;
    let req;
    let paramstore;
    let res = { send: errFunc};
    let Environment = {Environment: ENV, AWS_REGION: REGION };

    before(() => {
        sandbox = sinon.createSandbox();
        event = {AWS_REGION: REGION, env: ENV};
    });

    beforeEach(() => {
        event = {AWS_REGION: REGION, env: ENV};
        callback = () => {
        };

        config = {

        };

        sandbox.stub(res);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('jwks-endpoint without salt', function() {

        beforeEach(() => {
            sandbox.stub(process, 'env').value(_.extend(process.env, Environment));
            jwks = new JwksEndpoint(config, paramstore);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should return 500 if there is no primary key to use', () => {
            sandbox.stub(JwksCache.prototype, 'getParams').rejects();
            return jwks.getJwks(req, res).then(() => {
                    should(res.send.callCount).eql(1);
                    should(res.send.getCall(0).args[0]).eql(500);
            });
        });

        it('should return 500 if there is no primary key to use', () => {
            sandbox.stub(JwksCache.prototype, 'getParams').resolves(
                {});
            return jwks.getJwks(req, res).then(() => {
                    should(res.send.callCount).eql(1);
                    should(res.send.getCall(0).args[0]).eql(500);
                    should(res.send.getCall(0).args[1]).eql(new Error('Failed to retrieve primary key'))
            });
        });

        it('should return 500 if there is no secondary key to use', () => {
            sandbox.stub(JwksCache.prototype, 'getParams').resolves(
                {
                    '/local/accessToken.primary.publicKey': 'testPublicKey'
                });
            return jwks.getJwks(req, res).then(() => {
                    should(res.send.callCount).eql(1);
                    should(res.send.getCall(0).args[0]).eql(500);
                    should(res.send.getCall(0).args[1]).eql(new Error('Failed to retrieve secondary key'))
            });
        });

        it('should return 200 if there is primary and secondary key as well', () => {
            sandbox.stub(JwksCache.prototype, 'getParams').resolves(PARAMSTORE_DATA);
            const expectedOutput = GENERATED_DATA;
            return jwks.getJwks(req, res).then(() => {
                    should(res.send.callCount).eql(1);
                    should(res.send.getCall(0).args[0]).eql(200);
                    should(res.send.getCall(0).args[1]).eql(expectedOutput)
            });
        });
    });

    describe('jwks-endpoint with salt', function() {

        beforeEach(() => {
            Environment.salt = 'salt';
            sandbox.stub(process, 'env').value(_.extend(process.env, Environment));
            jwks = new JwksEndpoint(config, paramstore);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should return 500 if there is no primary key to use', () => {
            sandbox.stub(JwksCache.prototype, 'getParams').rejects();
            return jwks.getJwks(req, res).then(() => {
                    should(res.send.callCount).eql(1);
                    should(res.send.getCall(0).args[0]).eql(500);
            });
        });

        it('should return 500 if there is no primary key to use', () => {
            sandbox.stub(JwksCache.prototype, 'getParams').resolves(
                {});
            return jwks.getJwks(req, res).then(() => {
                    should(res.send.callCount).eql(1);
                    should(res.send.getCall(0).args[0]).eql(500);
                    should(res.send.getCall(0).args[1]).eql(new Error('Failed to retrieve primary key'))
            });
        });

        it('should return 500 if there is no secondary key to use', () => {
            sandbox.stub(JwksCache.prototype, 'getParams').resolves(
                {
                    '/local/accessToken.primary.publicKey': 'testPublicKey'
                });
            return jwks.getJwks(req, res).then(() => {
                    should(res.send.callCount).eql(1);
                    should(res.send.getCall(0).args[0]).eql(500);
                    should(res.send.getCall(0).args[1]).eql(new Error('Failed to retrieve secondary key'))
            });
        });

        it('should return 200 if there is primary and secondary key as well', () => {
            sandbox.stub(JwksCache.prototype, 'getParams').resolves(PARAMSTORE_DATA);
            const expectedOutput = GENERATED_DATA_WITH_SALT;
            return jwks.getJwks(req, res).then(() => {
                    should(res.send.callCount).eql(1);
                    should(res.send.getCall(0).args[0]).eql(200);
                    should(res.send.getCall(0).args[1]).eql(expectedOutput)
            });
        });

    });
});
