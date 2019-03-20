const sinon = require('sinon');
const _ = require('underscore');
const JwksLambda = require('../../lib/JwksLambda');
const should = require('should');
const ParameterService = require('@sage/bc-services-parameter');

describe('JwksLambda', function () {

    const errFunc = () => {
        throw new Error('should be stubbed')
    };

    const doNothing = () => {

    };

    const paramStoreData = {
        'accessToken.primary.publicKey': 'testPrimaryPublicKey',
        'accessToken.primary.privateKey': 'testPrimaryPrivateKey',
        'accessToken.primary.createdAt': '1553094111',

        'accessToken.secondary.publicKey': 'testSecondaryPublicKey',
        'accessToken.secondary.privateKey': 'testSecondaryPrivateKey',
        'accessToken.secondary.createdAt': '1553094111'
    };

    const paramStoreDataChange = {
        'accessToken.primary.publicKey': 'testPrimaryPublicKeyChanged',
        'accessToken.primary.privateKey': 'testPrimaryPrivateKeyChanged',
        'accessToken.primary.createdAt': '1553094112',

        'accessToken.secondary.publicKey': 'testSecondaryPublicKeyChanged',
        'accessToken.secondary.privateKey': 'testSecondaryPrivateKeyChanged',
        'accessToken.secondary.createdAt': '1553094112'
    };

    const paramStorePrimary = {
        'accessToken.primary.publicKey': 'testPrimaryPublicKey',
        'accessToken.primary.privateKey': 'testPrimaryPrivateKey',
        'accessToken.primary.createdAt': '1553094111'
    };

    const paramStoreSecondary = {
        'accessToken.secondary.publicKey': 'testSecondaryPublicKey',
        'accessToken.secondary.privateKey': 'testSecondaryPrivateKey',
        'accessToken.secondary.createdAt': '1553094111'
    };

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


    const primaryPublicKeyChanged = {
        "kty": "RSA",
        "alg": "RS256",
        "use": "sig",
        "kid": "323f3154f3734e29f9536b068ee739b4339d1773ed443c39425ebe6f635e683d",
        "x5c": ["testPrimaryPublicKeyChanged"]
    };

    const secondaryPublicKeyChanged = {
        "kty": "RSA",
        "alg": "RS256",
        "use": "sig",
        "kid": "20167f68866cd47d39fd36788353ee98291a4b9b9bcbbafa64137a3bf2166b66",
        "x5c": ["testSecondaryPublicKeyChanged"]
    };

    const cachedData = [
        primaryPublicKey, secondaryPublicKey
    ];

    const cachedDataChanged = [
        primaryPublicKeyChanged, secondaryPublicKeyChanged
    ]

    const env = 'local';
    const region = 'eu-west-1';

    let jwksLambda;
    let sandbox;
    let paramstore = {
        getParameters: errFunc
    };
    let logger = {
        info: doNothing,
        err: doNothing
    };

    let clock;
    let event = {
        logger: logger
    };
    let context;
    let callback;

    let cacheTTL = 100;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    let config;

    beforeEach(() => {
        clock = sinon.useFakeTimers(new Date().getTime());

        config = {Environment: env, AWS_REGION: region, cacheExpiry: cacheTTL }
        event = {AWS_REGION: region, env};

        sandbox.stub(ParameterService, 'Create').returns(paramstore);

        callback = sinon.spy();
    });

    afterEach(() => {
        clock.restore();
        sandbox.restore();
    });

    //describe('Checking basic functionalities')
    it('should get keys from paramstore if the cache is empty', () => {
        jwksLambda = new JwksLambda({ config });
        sandbox.stub(paramstore, 'getParameters')
            .onCall(0).resolves( paramStoreData );
        return jwksLambda.run(event, context, callback).then(() => {
            should(paramstore.getParameters.callCount).eql(1);

            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[0]).be.null();
            should(callback.getCall(0).args[1]).eql({
                statusCode: 200,
                body: JSON.stringify({ keys: cachedData })
            });

        });
    });

    it('should get secondary from paramstore (no primary key)', () => {
        jwksLambda = new JwksLambda({ config });
        sandbox.stub(paramstore, 'getParameters')
            .onCall(0).resolves( paramStoreSecondary );
        return jwksLambda.run(event, context, callback).then(() => {
            should(paramstore.getParameters.callCount).eql(1);

            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[0]).be.null();
            should(callback.getCall(0).args[1]).eql({
                statusCode: 200,
                body: JSON.stringify({ keys: [secondaryPublicKey] })
            });

        });
    });

    it('should get secondary from paramstore (no secondary key)', () => {
        jwksLambda = new JwksLambda({ config });
        sandbox.stub(paramstore, 'getParameters')
            .onCall(0).resolves( paramStorePrimary );
        return jwksLambda.run(event, context, callback).then(() => {
            should(paramstore.getParameters.callCount).eql(1);

            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[0]).be.null();
            should(callback.getCall(0).args[1]).eql({
                statusCode: 200,
                body: JSON.stringify({ keys: [primaryPublicKey] })
            });

        });
    });

    it('should return error if the cache is corrupt (empty json)', () => {
        jwksLambda = new JwksLambda({ config });
        sandbox.stub(paramstore, 'getParameters')
            .onCall(0).resolves( {} );
        return jwksLambda.run(event, context, callback).then(() => {
            should(paramstore.getParameters.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[1]['statusCode']).eql(500);

        });
    });

    it('should return error if the cache is corrupt (undefined)', () => {
        jwksLambda = new JwksLambda({ config });
        sandbox.stub(paramstore, 'getParameters')
            .onCall(0).resolves( undefined );
        return jwksLambda.run(event, context, callback).then(() => {
            should(paramstore.getParameters.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[1]['statusCode']).eql(500);

        });
    });

    it('should return error if the cache rejects', () => {
        jwksLambda = new JwksLambda({ config });
        sandbox.stub(paramstore, 'getParameters')
            .onCall(0).rejects();
        return jwksLambda.run(event, context, callback).then(() => {
            should(paramstore.getParameters.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[1]['statusCode']).eql(500);

        });
    });

    describe('Checking the pass of the time', () => {
        it('should get the same result if cache is not expired and called immediately again', () => {
            jwksLambda = new JwksLambda({ config });
            sandbox.stub(paramstore, 'getParameters')
                .onCall(0).resolves( paramStoreData )
                .onCall(1).resolves( paramStoreDataChange );
            return jwksLambda.run(event, context, callback).then(() => {
                should(paramstore.getParameters.callCount).eql(1);

                should(callback.callCount).eql(1);
                should(callback.getCall(0).args[0]).be.null();
                should(callback.getCall(0).args[1]).eql({
                    statusCode: 200,
                    body: JSON.stringify({keys: cachedData})
                });

                return jwksLambda.run(event, context, callback).then(() => {
                    should(paramstore.getParameters.callCount).eql(1);

                    should(callback.callCount).eql(2);
                    should(callback.getCall(1).args[0]).be.null();
                    should(callback.getCall(1).args[1]).eql({
                        statusCode: 200,
                        body: JSON.stringify({keys: cachedData})
                    });

                });
            });
        });

        it('should get the same result if cache is not expired', () => {
            jwksLambda = new JwksLambda({ config });
            sandbox.stub(paramstore, 'getParameters')
                .onCall(0).resolves( paramStoreData )
                .onCall(1).resolves( paramStoreDataChange );
            return jwksLambda.run(event, context, callback).then(() => {
                should(paramstore.getParameters.callCount).eql(1);

                should(callback.callCount).eql(1);
                should(callback.getCall(0).args[0]).be.null();
                should(callback.getCall(0).args[1]).eql({
                    statusCode: 200,
                    body: JSON.stringify({keys: cachedData})
                });

                clock.tick((cacheTTL - 1) * 1000);

                return jwksLambda.run(event, context, callback).then(() => {
                    should(paramstore.getParameters.callCount).eql(1);

                    should(callback.callCount).eql(2);
                    should(callback.getCall(1).args[0]).be.null();
                    should(callback.getCall(1).args[1]).eql({
                        statusCode: 200,
                        body: JSON.stringify({keys: cachedData})
                    });

                });
            });
        });

        it('should get the same result if cache is not expired', () => {
            jwksLambda = new JwksLambda({ config });
            sandbox.stub(paramstore, 'getParameters')
                .onCall(0).resolves( paramStoreData )
                .onCall(1).resolves( paramStoreDataChange );
            return jwksLambda.run(event, context, callback).then(() => {
                should(paramstore.getParameters.callCount).eql(1);

                should(callback.callCount).eql(1);
                should(callback.getCall(0).args[0]).be.null();
                should(callback.getCall(0).args[1]).eql({
                    statusCode: 200,
                    body: JSON.stringify({keys: cachedData})
                });

                clock.tick((cacheTTL + 1) * 1000);

                return jwksLambda.run(event, context, callback).then(() => {
                    should(paramstore.getParameters.callCount).eql(2);

                    should(callback.callCount).eql(2);
                    should(callback.getCall(1).args[0]).be.null();
                    should(callback.getCall(1).args[1]).eql({
                        statusCode: 200,
                        body: JSON.stringify({keys: cachedDataChanged})
                    });

                });
            });
        });
    });
});
