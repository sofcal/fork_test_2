const sinon = require('sinon');
const _ = require('underscore');
const JwksEndpoint = require('../../src/JwksEndpoint');
const should = require('should');


describe('jwks-endpoint with cache', function() {

    const errFunc = () => {
        throw new Error('should be stubbed')
    };

    const CACHE_TTL = 100;
    const PRIMARY_PUBLICKEY_KEY = '/local/accessToken.primary.publicKey';
    const SECONDARY_PUBLICKEY_KEY = '/local/accessToken.secondary.publicKey';

    const PARAMSTORE_DATA = {
        '/local/accessToken.primary.publicKey': 'testPrimaryPublicKey',
        '/local/accessToken.secondary.publicKey': 'testSecondaryPublicKey'
    };

    const CHANGED_PARAMSTORE_DATA = {
        '/local/accessToken.primary.publicKey': 'testPrimaryPublicKeyChanged',
        '/local/accessToken.secondary.publicKey': 'testSecondaryPublicKeyChanged'
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

    const CHANGED_GENERATED_DATA = {
        keys: [{
            kty: 'RSA',
            alg: 'RS256',
            use: 'sig',
            kid: 'e9a44c6eddea52df46b5aca644e79de922d593b55b2c32f418a73f6afcdfdc1b',
            x5c: [ 'testPrimaryPublicKeyChanged' ]
        }, {
            kty: 'RSA',
            alg: 'RS256',
            use: 'sig',
            kid: '3c5f24b7ccffd7c4e8e9412855eaac1f906ce4576fae5b79a53290746e49dfa7',
            x5c: [ 'testSecondaryPublicKeyChanged' ]
        }]
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

    const CHANGED_GENERATED_DATA_WITH_SALT = {
        keys: [{
            kty: 'RSA',
            alg: 'RS256',
            use: 'sig',
            kid: '83f1ca1dd64a6f2f6e9c103b7f972aae3f680f3d9a30b535cd8b65b3aa235f96',
            x5c: [ 'testPrimaryPublicKeyChanged' ]
        }, {
            kty: 'RSA',
            alg: 'RS256',
            use: 'sig',
            kid: '0c281cd0582415f5393ebfa0177468785947eee274572c1def3bbd2b61c765e4',
            x5c: [ 'testSecondaryPublicKeyChanged' ]
        }]
    };

    const ENV = 'local';
    const REGION = 'eu-west-1';

    const now = new Date().getTime();

    let sandbox;
    let config;
    let event;
    let jwks;
    let paramstore = {
        getParameters: errFunc
    };
    let req;
    let res = { send: errFunc};
    let Environment = {Environment: ENV, AWS_REGION: REGION };
    let clock;

    before(() => {
        sandbox = sinon.createSandbox();
        event = {AWS_REGION: REGION, env: ENV};
    });

    beforeEach(() => {
        event = {AWS_REGION: REGION, env: ENV};

        config = {
            paramPrefix: `/${ENV}/`,
            cacheExpiry: CACHE_TTL
        };

        sandbox.stub(res);

        clock = sinon.useFakeTimers(now);

    });

    afterEach(() => {
        clock.restore();
        sandbox.restore();
    });

    describe('jwks-endpoint with cache without salt', () => {

        beforeEach(() => {
            sandbox.stub(process, 'env').value(_.extend(process.env, Environment));
            jwks = new JwksEndpoint(config, paramstore);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should return 500 if there is no primary key to use', () => {
            sandbox.stub(paramstore, 'getParameters').rejects();
            return jwks.getJwks(req, res).then(() => {
                should(res.send.callCount).eql(1);
                should(res.send.getCall(0).args[0]).eql(500);

                should(paramstore.getParameters.calledOnce);
                should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);
            });
        });

        it('should return 500 if there is no primary key to use', () => {
            sandbox.stub(paramstore, 'getParameters').resolves({});
            return jwks.getJwks(req, res).then(() => {
                should(res.send.callCount).eql(1);
                should(res.send.getCall(0).args[0]).eql(500);
                should(res.send.getCall(0).args[1]).eql(new Error('Failed to retrieve primary key'));

                should(paramstore.getParameters.calledOnce);
                should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);
            });
        });

        it('should return 500 if there is no secondary key to use', () => {
            sandbox.stub(paramstore, 'getParameters').resolves(
                {
                    '/local/accessToken.primary.publicKey': 'testPublicKey'
                });
            return jwks.getJwks(req, res).then(() => {
                should(res.send.callCount).eql(1);
                should(res.send.getCall(0).args[0]).eql(500);
                should(res.send.getCall(0).args[1]).eql(new Error('Failed to retrieve secondary key'));

                should(paramstore.getParameters.calledOnce);
                should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);
            });
        });

        it('should return 200 if there is primary and secondary key as well', () => {
            sandbox.stub(paramstore, 'getParameters').resolves(PARAMSTORE_DATA);
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
                should(res.send.callCount).eql(1);
                should(res.send.getCall(0).args[0]).eql(200);
                should(res.send.getCall(0).args[1]).eql(expectedOutput);

                should(paramstore.getParameters.calledOnce);
                should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);
            });
        });

        it('should return the cached key if there is primary and secondary key as well', () => {
            sandbox.stub(paramstore, 'getParameters')
                .onCall(0).resolves( PARAMSTORE_DATA )
                .onCall(1).resolves(CHANGED_PARAMSTORE_DATA);
            const expectedOutput = GENERATED_DATA;
            return jwks.getJwks(req, res).then(() => {
                should(res.send.callCount).eql(1);
                should(res.send.getCall(0).args[0]).eql(200);
                should(res.send.getCall(0).args[1]).eql(expectedOutput);

                should(paramstore.getParameters.calledOnce);
                should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);

                clock.tick(CACHE_TTL  * 1000);

                return jwks.getJwks(req, res).then(() => {
                    should(res.send.callCount).eql(2);
                    should(res.send.getCall(1).args[0]).eql(200);
                    should(res.send.getCall(1).args[1]).eql(expectedOutput);

                    should(paramstore.getParameters.calledOnce);
                    should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                    should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);
                })
            });
        });

        it('should return a new key if the cache is expired and there is primary and secondary key as well', () => {
            sandbox.stub(paramstore, 'getParameters')
                .onCall(0).resolves( PARAMSTORE_DATA )
                .onCall(1).resolves(CHANGED_PARAMSTORE_DATA);
            return jwks.getJwks(req, res).then(() => {
                should(res.send.callCount).eql(1);
                should(res.send.getCall(0).args[0]).eql(200);
                should(res.send.getCall(0).args[1]).eql(GENERATED_DATA);

                should(paramstore.getParameters.calledOnce);
                should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);

                clock.tick( (CACHE_TTL + 1)  * 1000);

                return jwks.getJwks(req, res).then(() => {
                    should(res.send.callCount).eql(2);
                    should(res.send.getCall(1).args[0]).eql(200);
                    should(res.send.getCall(1).args[1]).eql(CHANGED_GENERATED_DATA);

                    should(paramstore.getParameters.callCount).eql(2);
                    should(paramstore.getParameters.getCall(1).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                    should(paramstore.getParameters.getCall(1).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);
                })
            });
        });
    });

    describe('jwks-endpoint with cache with salt', () => {

        beforeEach(() => {
            Environment.salt = 'salt';
            sandbox.stub(process, 'env').value(_.extend(process.env, Environment));
            jwks = new JwksEndpoint(config, paramstore);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should return 500 if there is no primary key to use', () => {
            sandbox.stub(paramstore, 'getParameters').rejects();
            return jwks.getJwks(req, res).then(() => {
                should(res.send.callCount).eql(1);
                should(res.send.getCall(0).args[0]).eql(500);

                should(paramstore.getParameters.calledOnce);
                should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);
            });
        });

        it('should return 500 if there is no primary key to use', () => {
            sandbox.stub(paramstore, 'getParameters').resolves({});
            return jwks.getJwks(req, res).then(() => {
                should(res.send.callCount).eql(1);
                should(res.send.getCall(0).args[0]).eql(500);
                should(res.send.getCall(0).args[1]).eql(new Error('Failed to retrieve primary key'));

                should(paramstore.getParameters.calledOnce);
                should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);
            });
        });

        it('should return 500 if there is no secondary key to use', () => {
            sandbox.stub(paramstore, 'getParameters').resolves(
                {
                    '/local/accessToken.primary.publicKey': 'testPublicKey'
                });
            return jwks.getJwks(req, res).then(() => {
                should(res.send.callCount).eql(1);
                should(res.send.getCall(0).args[0]).eql(500);
                should(res.send.getCall(0).args[1]).eql(new Error('Failed to retrieve secondary key'));

                should(paramstore.getParameters.calledOnce);
                should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);
            });
        });

        it('should return 200 if there is primary and secondary key as well', () => {
            sandbox.stub(paramstore, 'getParameters').resolves(PARAMSTORE_DATA);
            const expectedOutput = {
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
            return jwks.getJwks(req, res).then(() => {
                should(res.send.callCount).eql(1);
                should(res.send.getCall(0).args[0]).eql(200);
                should(res.send.getCall(0).args[1]).eql(expectedOutput);

                should(paramstore.getParameters.calledOnce);
                should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);
            });
        });

        it('should return the cached key if there is primary and secondary key as well', () => {
            sandbox.stub(paramstore, 'getParameters')
                .onCall(0).resolves( PARAMSTORE_DATA )
                .onCall(1).resolves(CHANGED_PARAMSTORE_DATA);
            return jwks.getJwks(req, res).then(() => {
                should(res.send.callCount).eql(1);
                should(res.send.getCall(0).args[0]).eql(200);
                should(res.send.getCall(0).args[1]).eql(GENERATED_DATA_WITH_SALT);

                should(paramstore.getParameters.calledOnce);
                should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);

                clock.tick(CACHE_TTL  * 1000);

                return jwks.getJwks(req, res).then(() => {
                    should(res.send.callCount).eql(2);
                    should(res.send.getCall(1).args[0]).eql(200);
                    should(res.send.getCall(1).args[1]).eql(GENERATED_DATA_WITH_SALT);

                    should(paramstore.getParameters.calledOnce);
                    should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                    should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);
                })
            });
        });

        it('should return a new key if the cache is expired and there is primary and secondary key as well', () => {
            sandbox.stub(paramstore, 'getParameters')
                .onCall(0).resolves( PARAMSTORE_DATA )
                .onCall(1).resolves(CHANGED_PARAMSTORE_DATA);
            return jwks.getJwks(req, res).then(() => {
                should(res.send.callCount).eql(1);
                should(res.send.getCall(0).args[0]).eql(200);
                should(res.send.getCall(0).args[1]).eql(GENERATED_DATA_WITH_SALT);

                should(paramstore.getParameters.calledOnce);
                should(paramstore.getParameters.getCall(0).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                should(paramstore.getParameters.getCall(0).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);

                clock.tick( (CACHE_TTL + 1)  * 1000);

                return jwks.getJwks(req, res).then(() => {
                    should(res.send.callCount).eql(2);
                    should(res.send.getCall(1).args[0]).eql(200);
                    should(res.send.getCall(1).args[1]).eql(CHANGED_GENERATED_DATA_WITH_SALT);

                    should(paramstore.getParameters.callCount).eql(2);
                    should(paramstore.getParameters.getCall(1).args[0][0]).eql(PRIMARY_PUBLICKEY_KEY);
                    should(paramstore.getParameters.getCall(1).args[0][1]).eql(SECONDARY_PUBLICKEY_KEY);
                })
            });
        });
    });
});
