const sinon = require('sinon');
const _ = require('underscore');
const JwksCache = require('../../src/JwksCache');
const should = require('should');

describe('jwks-cache', function () {

    const errFunc = () => {
        throw new Error('should be stubbed')
    };

    const doNothing = () => {

    }

    const PARAMSTORE_DATA =             {
        '/local/accessToken.primary.publicKey': 'testPrimaryPublicKey',
        '/local/accessToken.secondary.publicKey': 'testSecondaryPublicKey'
    };

    const CHANGED_PARAMSTORE_DATA =             {
        '/local/accessToken.primary.publicKey': 'testUpdatedPrimaryPublicKeyUpdated',
        '/local/accessToken.secondary.publicKey': 'testUpdatedPrimaryPublicKeyUpdated'
    };

    const ENV = 'local';
    const REGION = 'eu-west-1';
    const CACHE_TTL = 100;

    let jwksCache;
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

    before(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {

        config = {
            paramPrefix: `/${ENV}/`,
            cacheExpiry: CACHE_TTL
        };

        clock = sinon.useFakeTimers(new Date().getTime());

        sandbox.stub(paramstore, 'getParameters').resolves(PARAMSTORE_DATA);
    });

    afterEach(() => {
        clock.restore();

        sandbox.restore();
    });

    it('should get keys from paramstore if the cache is empty', () => {
        jwksCache = new JwksCache(config, logger, paramstore);
        return jwksCache.getParams().then(() => {
            should(paramstore.getParameters.callCount).eql(1);
        });
    });

    it('should call paramstore with the proper args if the cache is empty', () => {
        jwksCache = new JwksCache(config, logger, paramstore);
        return jwksCache.getParams().then(() => {
            should(paramstore.getParameters.callCount).eql(1);
            should(paramstore.getParameters.getCall(0).args[0][0]).eql('/local/accessToken.primary.publicKey');
            should(paramstore.getParameters.getCall(0).args[0][1]).eql('/local/accessToken.secondary.publicKey');
        });
    });

    it('should give the proper data back from paramstore', () => {
        let expected = PARAMSTORE_DATA;
        jwksCache = new JwksCache(config, logger, paramstore);
        return jwksCache.getParams().then((data) => {
            should(paramstore.getParameters.callCount).eql(1);
            should(paramstore.getParameters.getCall(0).args[0][0]).eql('/local/accessToken.primary.publicKey');
            should(paramstore.getParameters.getCall(0).args[0][1]).eql('/local/accessToken.secondary.publicKey');
            should(data).eql(expected);
        });
    });

    it('should fetch data only once from paramstore if the cache is not expired ', () => {
        let expected = PARAMSTORE_DATA;
        jwksCache = new JwksCache(config, logger, paramstore);
        return jwksCache.getParams().then((data) => {
            should(paramstore.getParameters.callCount).eql(1);
            should(paramstore.getParameters.getCall(0).args[0][0]).eql('/local/accessToken.primary.publicKey');
            should(paramstore.getParameters.getCall(0).args[0][1]).eql('/local/accessToken.secondary.publicKey');

            sandbox.restore();
            sandbox.stub(paramstore, 'getParameters').resolves(CHANGED_PARAMSTORE_DATA); // Let's change the paramstore value to see whether it is from the or cached

            clock.tick(CACHE_TTL * 1000);

            return jwksCache.getParams().then((dataTwo) => {
                should(paramstore.getParameters.callCount).eql(0); // Because of the restore -> it is not called again
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
            should(paramstore.getParameters.getCall(0).args[0][0]).eql('/local/accessToken.primary.publicKey');
            should(paramstore.getParameters.getCall(0).args[0][1]).eql('/local/accessToken.secondary.publicKey');
            should(data).eql(expected);


            sandbox.restore();
            sandbox.stub(paramstore, 'getParameters').resolves(CHANGED_PARAMSTORE_DATA);

            clock.tick((CACHE_TTL + 1) * 1000);

            return jwksCache.getParams().then((dataTwo) => {
                should(paramstore.getParameters.callCount).eql(1);  // Because of the restore -> it is called again
                should(paramstore.getParameters.getCall(0).args[0][0]).eql('/local/accessToken.primary.publicKey');
                should(paramstore.getParameters.getCall(0).args[0][1]).eql('/local/accessToken.secondary.publicKey');
                should(dataTwo).eql(nextExpected);
            })
        });
    });

});
