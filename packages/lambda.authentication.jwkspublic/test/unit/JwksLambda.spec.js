const sinon = require('sinon');
const _ = require('underscore');
const JwksLambdaSpec = require('../../lib/JwksLambda');
const should = require('should');
const { Cache } = require('@sage/sfab-s2s-jwt-cache');
const ParameterService = require('@sage/bc-services-parameter');

describe('JwksLambda', function () {

    const errFunc = () => {
        throw new Error('should be stubbed')
    };

    const doNothing = () => {

    };

    const PRIMARY_PUBLICKEY_KEY = 'accessToken.primary.publicKey';
    const SECONDARY_PUBLICKEY_KEY = 'accessToken.secondary.publicKey';

    const primaryPublicKey = {
        "kty": "RSA",
        "alg": "RS256",
        "use": "sig",
        "kid": "4581388218a7cc901028b172453c6922dbb4c2f6eeb5f6a9d51350731d9f21a6",
        "x5c": ["testPrimaryPublicKey"]
    };

    const secondaryPublicKey = {
        "kty": "RSA",
        "alg": "RS256",
        "use": "sig",
        "kid": "3bcbf0ad8dc57fb595be230cbdaed770a7bdf16f22a99130bd101f40816cce50",
        "x5c": ["testSecondaryPublicKey"]
    };

    const paramStoreData = {
        'accessToken.primary.publicKey': 'testPrimaryPublicKey',
        'accessToken.primary.privateKey': 'testPrimaryPrivateKey',
        'accessToken.primary.createdAt': 0,

        'accessToken.secondary.publicKey': 'testSecondaryPublicKey',
        'accessToken.secondary.privateKey': 'testSecondaryPrivateKey',
        'accessToken.secondary.createdAt': 0
    };

    const cachedData = [
        primaryPublicKey, secondaryPublicKey
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
        config = {Environment: env, AWS_REGION: region, cacheExpiry: CACHE_TTL }


        clock = sinon.useFakeTimers(new Date().getTime());

        sandbox.stub(process, 'env').value(_.extend(process.env, {Environment: env, AWS_REGION: region, cacheExpiry: 10000  }));
        event = {AWS_REGION: region, env};

        callback = sinon.spy();
    });

    afterEach(() => {
        clock.restore();
        sandbox.restore();
    });

    it('should get keys from paramstore if the cache is empty', () => {
        jwksLambda = JwksLambdaSpec.Create({ config });
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).resolves( cachedData );
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[0]).be.null();
            should(callback.getCall(0).args[1]).eql({
                statusCode: 200,
                body: JSON.stringify({ keys: cachedData })
            });

        });
    });

    it('should return the same key after running twice', () => {
        jwksLambda = JwksLambdaSpec.Create({ config });
        sandbox.stub(Cache.prototype, 'getData')
            .resolves( cachedData );
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[0]).be.null();
            should(callback.getCall(0).args[1]).eql({
                statusCode: 200,
                body: JSON.stringify({ keys: cachedData })
            });
            return jwksLambda.run(event, context, callback).then(() => {
                should(Cache.prototype.getData.callCount).eql(2);
                should(callback.callCount).eql(2);
                should(callback.getCall(1).args[0]).be.null();
                should(callback.getCall(1).args[1]).eql({
                    statusCode: 200,
                    body: JSON.stringify({ keys: cachedData })
                });
            });

        });
    });

    it('should get secondary from paramstore (no primary key)', () => {
        jwksLambda = JwksLambdaSpec.Create({ config });
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).resolves( [secondaryPublicKey]);
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[0]).be.null();
            should(callback.getCall(0).args[1]).eql({
                statusCode: 200,
                body: JSON.stringify({ keys: [secondaryPublicKey] })
            });

        });
    });

    it('should get primary from paramstore (no secondary key)', () => {
        jwksLambda = JwksLambdaSpec.Create({ config });
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).resolves( [primaryPublicKey] )
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[0]).be.null();
            should(callback.getCall(0).args[1]).eql({
                statusCode: 200,
                body: JSON.stringify({ keys: [primaryPublicKey] })
            });

        });
    });

    it('should return error if the cache is corrupt (empty json)', () => {
        jwksLambda = JwksLambdaSpec.Create({ config });
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).resolves( { } )
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[1]['statusCode']).eql(500);

        });
    });

    it('should return error if the cache is corrupt (undefined)', () => {
        jwksLambda = JwksLambdaSpec.Create({ config });
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).resolves( undefined )
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[1]['statusCode']).eql(500);

        });
    });

    it('should return error if the cache rejects', () => {
        jwksLambda = JwksLambdaSpec.Create({ config });
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).rejects();
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[1]['statusCode']).eql(500);

        });
    });

    it('should get data from paramServices', () => {
        jwksLambda = JwksLambdaSpec.Create({ config });
        sandbox.stub(ParameterService, 'Create').returns(paramstore);
        sandbox.stub(paramstore, 'getParameters')
            .onCall(0).resolves( paramStoreData );
        return jwksLambda.run(event, context, callback).then(() => {
            should(paramstore.getParameters.callCount).eql(1);

            should(callback.getCall(0).args[1]).eql({
                statusCode: 200,
                body: JSON.stringify({keys: cachedData})
            });

        });
    });

});
