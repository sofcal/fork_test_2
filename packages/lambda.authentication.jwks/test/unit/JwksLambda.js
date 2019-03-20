const sinon = require('sinon');
const _ = require('underscore');
const JwksLambda = require('../../lib/JwksLambda');
const should = require('should');
const { Cache } = require('@sage/bc-data-cache');

describe('JwksLambda', function () {

    const errFunc = () => {
        throw new Error('should be stubbed')
    };

    const doNothing = () => {

    };

    const PRIMARY_PUBLICKEY_KEY = 'accessToken.primary.publicKey';
    const SECONDARY_PUBLICKEY_KEY = 'accessToken.secondary.publicKey';

    const PARAMSTORE_DATA = [
        {
            "kty": "RSA",
            "alg": "RS256",
            "use": "sig",
            "kid": "26bc2a4b18ad162f9c2e9f1103317fc07bf4fff0908251077e6a9154962d7ad9",
            "x5c": "testPrimaryPublicKey"
        },
        {
            "kty": "RSA",
            "alg": "RS256",
            "use": "sig",
            "kid": "9751bce2a5126b5910ae48a94fddb5ffbb2f0bc2a1879fc84cd54eed983ec2fc",
            "x5c": "testSecondaryPublicKey"
        }
    ];

    const env = 'local';
    const region = 'eu-west-1';
    const ENV = 'local';
    const CACHE_TTL = 100;

    let jwksLambda;
    let sandbox;
    let paramstore = {
        getParameters: errFunc
    };
    let logger = {
        info: doNothing,
        err: doNothing
    };
    let config;
    let clock;
    let event = {
        logger: logger
    };
    let context;
    let callback;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {
        config = {
            paramPrefix: `/${ENV}/`,
            cacheExpiry: CACHE_TTL
        };

        clock = sinon.useFakeTimers(new Date().getTime());

        sandbox.stub(process, 'env').value(_.extend(process.env, {Environment: env, AWS_REGION: region }));
        event = {AWS_REGION: region, env};

        sandbox.stub(paramstore, 'getParameters')
            .onCall(0).resolves( PARAMSTORE_DATA );

        callback = sinon.spy();
    });

    afterEach(() => {
        clock.restore();
        sandbox.restore();
    });

    it('should get keys from paramstore if the cache is empty', () => {
        jwksLambda = new JwksLambda({ config: process.env });
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).resolves( PARAMSTORE_DATA );
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[0]).be.null();
            should(callback.getCall(0).args[1]).eql({
                statusCode: 200,
                body: JSON.stringify({ keys: PARAMSTORE_DATA })
            });

        });
    });

    it('should get secondary from paramstore (no primary key)', () => {
        jwksLambda = new JwksLambda({ config: process.env });
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).resolves( { 'accessToken.secondary.publicKey': 'testSecondaryPublicKey' } )
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[0]).be.null();
            should(callback.getCall(0).args[1]).eql({
                statusCode: 200,
                body: JSON.stringify({ keys: { 'accessToken.secondary.publicKey': 'testSecondaryPublicKey' } })
            });

        });
    });

    it('should get primary from paramstore (no secondary key)', () => {
        jwksLambda = new JwksLambda({ config: process.env });
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).resolves( { 'accessToken.primary.publicKey': 'testPrimaryPublicKey' } )
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[0]).be.null();
            should(callback.getCall(0).args[1]).eql({
                statusCode: 200,
                body: JSON.stringify({ keys: { 'accessToken.primary.publicKey': 'testPrimaryPublicKey' } })
            });

        });
    });

    it('should return error if the cache is corrupt (empty json)', () => {
        jwksLambda = new JwksLambda({ config: process.env });
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).resolves( { } )
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[1]['statusCode']).eql(500);

        });
    });

    it('should return error if the cache is corrupt (undefined)', () => {
        jwksLambda = new JwksLambda({ config: process.env });
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).resolves( undefined )
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[1]['statusCode']).eql(500);

        });
    });

    it('should return error if the cache rejects', () => {
        jwksLambda = new JwksLambda({ config: process.env });
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).rejects();
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[1]['statusCode']).eql(500);

        });
    });

});
