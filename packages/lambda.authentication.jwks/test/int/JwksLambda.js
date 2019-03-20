const sinon = require('sinon');
const _ = require('underscore');
const JwksLambda = require('../../lib/JwksLambda');
const should = require('should');
const { Cache } = require('@sage/bc-data-cache');
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

    const cachedData = [
        primaryPublicKey, secondaryPublicKey
    ];

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

    before(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {
        clock = sinon.useFakeTimers(new Date().getTime());

        sandbox.stub(process, 'env').value(_.extend(process.env, {Environment: env, AWS_REGION: region }));
        event = {AWS_REGION: region, env};

        sandbox.stub(ParameterService, 'Create').returns(paramstore);

        callback = sinon.spy();
    });

    afterEach(() => {
        clock.restore();
        sandbox.restore();
    });

    it('should get keys from paramstore if the cache is empty', () => {
        jwksLambda = new JwksLambda({ config: process.env });
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
        jwksLambda = new JwksLambda({ config: process.env });
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
        jwksLambda = new JwksLambda({ config: process.env });
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
        jwksLambda = new JwksLambda({ config: process.env });
        sandbox.stub(paramstore, 'getParameters')
            .onCall(0).resolves( {} );
        return jwksLambda.run(event, context, callback).then(() => {
            should(paramstore.getParameters.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[1]['statusCode']).eql(500);

        });
    });

    it('should return error if the cache is corrupt (undefined)', () => {
        jwksLambda = new JwksLambda({ config: process.env });
        sandbox.stub(paramstore, 'getParameters')
            .onCall(0).resolves( undefined );
        return jwksLambda.run(event, context, callback).then(() => {
            should(paramstore.getParameters.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[1]['statusCode']).eql(500);

        });
    });

    it('should return error if the cache rejects', () => {
        jwksLambda = new JwksLambda({ config: process.env });
        sandbox.stub(paramstore, 'getParameters')
            .onCall(0).rejects();
        return jwksLambda.run(event, context, callback).then(() => {
            should(paramstore.getParameters.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[1]['statusCode']).eql(500);

        });
    });

});
