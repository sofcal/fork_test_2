const sinon = require('sinon');
const _ = require('underscore');
const JwksEndpoint = require('../../src/JwksEndpoint');
const JwksCache = require('../../src/JwksCache');
const should = require('should');

describe('jwks-endpoint with cache', function() {

    const errFunc = () => {
        throw new Error('should be stubbed')
    };

    let sandbox;
    let config;
    let context;
    let event;
    let callback;
    let now;
    let jwks;
    let paramstore = {
        getParameters: errFunc
    };
    let req;
    let res = { send: errFunc};

    const TEST_DATE = 1552471130970;
    const ENV = 'local';
    const REGION = 'eu-west-1';

    before(() => {
        sandbox = sinon.createSandbox();
        event = {AWS_REGION: REGION, env: ENV};
    });

    beforeEach(() => {
        context = {context: 'context', logGroupName: 'logGroupName'};
        sandbox.stub(process, 'env').value(_.extend(process.env, {Environment: ENV, AWS_REGION: REGION }));
        event = {AWS_REGION: REGION, env: ENV};
        callback = () => {
        };

        config = {

        };

        jwks = new JwksEndpoint(config, paramstore);

        sandbox.stub(res);
        now = sinon.useFakeTimers(TEST_DATE);
    });

    afterEach(() => {
        now.restore();
        sandbox.restore();
    });

    it('should return 500 if there is no primary key to use', () => {
        sandbox.stub(paramstore, 'getParameters').rejects();
        return jwks.getJwks(req, res).then(() => {
            return Promise.all([
                should(res.send.callCount).eql(1),
                should(res.send.getCall(0).args[0]).eql(500),
            ])
        });
    });

    it('should return 500 if there is no primary key to use', () => {
        sandbox.stub(paramstore, 'getParameters').resolves({});
        return jwks.getJwks(req, res).then(() => {
            return Promise.all([
                should(res.send.callCount).eql(1),
                should(res.send.getCall(0).args[0]).eql(500),
                should(res.send.getCall(0).args[1]).eql(new Error('Failed to retrieve primary key'))
            ])
        });
    });

    it('should return 500 if there is no secondary key to use', () => {
        sandbox.stub(paramstore, 'getParameters').resolves(
            {
                '/local/accessToken.primary.publicKey': 'testPublicKey'
            });
        return jwks.getJwks(req, res).then(() => {
            return Promise.all([
                should(res.send.callCount).eql(1),
                should(res.send.getCall(0).args[0]).eql(500),
                should(res.send.getCall(0).args[1]).eql(new Error('Failed to retrieve secondary key'))
            ]);
        });
    });

    it('should return 200 if there is primary and secondary key as well', () => {
        sandbox.stub(paramstore, 'getParameters').resolves(
            {
                '/local/accessToken.primary.publicKey': 'testPrimaryPublicKey',
                '/local/accessToken.secondary.publicKey': 'testSecondaryPublicKey'
            });
        const expectedOutput = {
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
        return jwks.getJwks(req, res).then(() => {
            return Promise.all([
                should(res.send.callCount).eql(1),
                should(res.send.getCall(0).args[0]).eql(200),
                should(res.send.getCall(0).args[1]).eql(expectedOutput)
            ])
        });
    });

});
