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

    const PRIMARY_PUBLICKEY_KEY = '/local/accessToken.primary.publicKey';
    const SECONDARY_PUBLICKEY_KEY = '/local/accessToken.secondary.publicKey';

    const PARAMSTORE_DATA =             {
        '/local/accessToken.primary.publicKey': 'testPrimaryPublicKey',
        '/local/accessToken.secondary.publicKey': 'testSecondaryPublicKey'
    };

    const CHANGED_PARAMSTORE_DATA =             {
        '/local/accessToken.primary.publicKey': 'testUpdatedPrimaryPublicKeyUpdated',
        '/local/accessToken.secondary.publicKey': 'testUpdatedPrimaryPublicKeyUpdated'
    };


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
            .onCall(0).resolves( PARAMSTORE_DATA )
            .onCall(1).resolves(CHANGED_PARAMSTORE_DATA);

        callback = sinon.spy();
    });

    afterEach(() => {
        clock.restore();
        sandbox.restore();
    });

    it('should get keys from paramstore if the cache is empty', () => {
        jwksLambda = new JwksLambda();
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
        jwksLambda = new JwksLambda();
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).resolves( { '/local/accessToken.secondary.publicKey': 'testSecondaryPublicKey' } )
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[0]).be.null();
            should(callback.getCall(0).args[1]).eql({
                statusCode: 200,
                body: JSON.stringify({ keys: { '/local/accessToken.secondary.publicKey': 'testSecondaryPublicKey' } })
            });

        });
    });

    it('should get primary from paramstore (no secondary key)', () => {
        jwksLambda = new JwksLambda();
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).resolves( { '/local/accessToken.primary.publicKey': 'testPrimaryPublicKey' } )
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[0]).be.null();
            should(callback.getCall(0).args[1]).eql({
                statusCode: 200,
                body: JSON.stringify({ keys: { '/local/accessToken.primary.publicKey': 'testPrimaryPublicKey' } })
            });

        });
    });

    it('should return error if the cache is corrupt (empty json)', () => {
        jwksLambda = new JwksLambda();
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).resolves( { } )
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[1]['statusCode']).eql(500);

        });
    });

    it('should return error if the cache is corrupt (undefined)', () => {
        jwksLambda = new JwksLambda();
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).resolves( undefined )
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[1]['statusCode']).eql(500);

        });
    });

    it('should return error if the cache rejects', () => {
        jwksLambda = new JwksLambda();
        sandbox.stub(Cache.prototype, 'getData')
            .onCall(0).rejects();
        return jwksLambda.run(event, context, callback).then(() => {
            should(Cache.prototype.getData.callCount).eql(1);
            should(callback.callCount).eql(1);
            should(callback.getCall(0).args[1]['statusCode']).eql(500);

        });
    });

    /*
        it('should call paramstore with the proper args if the cache is empty', () => {
            jwksCache = new JwksCache(config, logger, paramstore);
            return jwksCache.getParams().then(() => {
                should(paramstore.getParameters.callCount).eql(1);
                should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);
            });
        });

        it('should give the proper data back from paramstore', () => {
            let expected = PARAMSTORE_DATA;
            jwksCache = new JwksCache(config, logger, paramstore);
            return jwksCache.getParams().then((data) => {
                should(paramstore.getParameters.callCount).eql(1);
                should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);
                should(data).eql(expected);
            });
        });

        it('should fetch data only once from paramstore if the cache is not expired ', () => {
            let expected = PARAMSTORE_DATA;
            jwksCache = new JwksCache(config, logger, paramstore);
            return jwksCache.getParams().then((data) => {
                should(paramstore.getParameters.callCount).eql(1);
                should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);

                clock.tick(CACHE_TTL * 1000);

                return jwksCache.getParams().then((dataTwo) => {
                    should(paramstore.getParameters.callCount).eql(1);
                    should(dataTwo).eql(expected);
                })
            });
        });

        it('should fetch data again from paramstore if the cache is expired ', () => {
            let expected = PARAMSTORE_DATA;
            let nextExpected = CHANGED_PARAMSTORE_DATA;
            jwksCache = new JwksCache(config, logger, paramstore);
            return jwksCache.getParams().then((data) => {
                should(paramstore.getParameters.callCount).eql(1);
                should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);
                should(data).eql(expected);

                clock.tick((CACHE_TTL + 1) * 1000);

                return jwksCache.getParams().then((dataTwo) => {
                    should(paramstore.getParameters.callCount).eql(2);  // Because of the restore -> it is called again
                    should(paramstore.getParameters.getCall(1).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                    should(paramstore.getParameters.getCall(1).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);
                    should(dataTwo).eql(nextExpected);
                })
            });
        }); */

});
