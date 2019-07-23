'use strict';

const Promise = require('bluebird');
const sinon = require('sinon');
const should = require('should');
const helpersWrapper = require('../../lib/helpers');

describe('@sage/bc-common-helpers.helpers', () => {
    let sandbox;

    const config = {
        featureFlags: {
            release: {
                fooFeature: true,
                barFeature: false,
            },
            pollingPeriod: 100,
        }
    };
    const keyValue = {
        release: {
            fooFeature: false,
            barFeature: true,
        }
    };

    let framework;
    let helpers;
    let sssManager;
    let keyValuePairCacheService;
    let retrievePair;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {
        framework = {
            common: {
                configuration: {
                    get: sandbox.stub().returns(config),
                },
            },
        };
        retrievePair = sandbox.stub().resolves({
            key: 'featureFlags',
            value: keyValue,
        });
        keyValuePairCacheService = {
            retrievePair,
        };
        sssManager = {
            getService: sandbox.stub().returns(keyValuePairCacheService),
        };
        helpers = helpersWrapper(sssManager, framework);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('basic structure', () => {
        it('Should export a function', () => {
            should(helpersWrapper).be.a.Function();
        });

        it('should return an object when called with sssManager/framework arguments', () => {
            should(helpers).have.properties('getConfig', 'feature');
            should(helpers.feature).have.properties('getAllFlags', 'getFlag', 'isEnabled');
        });
    });

    describe('featureFlags', () => {
        describe('isEnabled', () => {
            it('should check an active feature flag', (done) => {
                try {
                    should(helpers.feature.isEnabled('release', 'fooFeature')).eql(true);
                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should check an unknown feature flag', (done) => {
                try {
                    should(helpers.feature.isEnabled('release', 'plaid')).eql(false);
                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should check an inactive feature flag', (done) => {
                try {
                    should(helpers.feature.isEnabled('release', 'barFeature')).eql(false);
                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should default to feature being off if an unexpected type is supplied', (done) => {
                try {
                    should(helpers.feature.isEnabled('release', 'alive')).eql(false);
                    should(helpers.feature.isEnabled('jeremy')).eql(false);
                    should(helpers.feature.isEnabled('black', 'once')).eql(false);
                    should(helpers.feature.isEnabled(true)).eql(false);
                    should(helpers.feature.isEnabled(false)).eql(false);
                    should(helpers.feature.isEnabled(null)).eql(false);
                    should(helpers.feature.isEnabled(undefined)).eql(false);
                    should(helpers.feature.isEnabled([])).eql(false);
                    should(helpers.feature.isEnabled(1)).eql(false);
                    should(helpers.feature.isEnabled({ release: { fooFeature: true } })).eql(false);
                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });

        describe('getFlag', () => {
            it('should synchronously get a feature flag value', (done) => {
                const expected = true;

                sandbox.stub(helpers.feature, 'getFlag').returns(expected);

                should(helpers.feature.getFlag('intTestFeatureType', 'intTestFeatureKey')).eql(expected);
                should(helpers.feature.getFlag.calledOnce).be.true();
                done();
            });
        });

        describe('getAllFlags', () => {
            describe('standard processing', () => {
                it('should get all feature flags (uncached)', (done) => {
                    sandbox.stub(helpers, 'getConfig').returns(config);

                    try {
                        should(helpers.feature.getAllFlags()).deepEqual(config.featureFlags);
                        should(helpers.getConfig.calledOnce).be.true();
                        should(sssManager.getService.notCalled).be.true();

                        done();
                    } catch (err) {
                        done(err instanceof Error ? err : new Error(err));
                    }
                });

                it('should return undefined if config not found', (done) => {
                    sandbox.stub(helpers, 'getConfig').returns(undefined);

                    try {
                        should(helpers.feature.getAllFlags()).eql(undefined);
                        should(helpers.getConfig.calledOnce).be.true();
                        should(sssManager.getService.notCalled).be.true();

                        done();
                    } catch (err) {
                        done(err instanceof Error ? err : new Error(err));
                    }
                });
            });

            describe('dev environment - dynamically setting feature flags from redis cache', () => {
                // temporarily switch node env to 'dev'
                const tempNODE_ENV = process.env.NODE_ENV; // eslint-disable-line camelcase

                beforeEach(() => {
                    process.env.NODE_ENV = 'dev';
                });

                afterEach(() => {
                    process.env.NODE_ENV = tempNODE_ENV; // eslint-disable-line camelcase
                });

                it('should start polling redis service', () => {
                    sandbox.stub(helpers, 'getConfig').returns(config);

                    // set up delayPromise - which can be resolved by calling promiseResolve
                    // this allows us to use Promise.delay stub to check when checkKeyValuePairCache completes
                    let promiseResolve;
                    const delayPromise = new Promise((resolve) => {
                        promiseResolve = resolve;
                    });

                    sandbox.stub(Promise, 'delay').callsFake(() => {
                        promiseResolve(); // signal that processing is completed
                        // reject promise - stops checkKeyValuePairCache from calling itself again
                        return Promise.reject(new Error('stop'));
                    });

                    return Promise.resolve()
                        .then(() => helpers.feature.getAllFlags())
                        .then((res) => {
                            should(res).eql(config.featureFlags, `Config should be returned from helpers.getConfig().featureFlags - actual ${res}`);
                            return delayPromise; // wait for Promise.delay to run - which should be end of checkKeyValuePairCache calls
                        })
                        .then(() => {
                            should(helpers.getConfig.callCount).eql(2, `getConfig should be called in body of getAllFlags + in checkKeyValuePairCache - actual count ${helpers.getConfig.callCount}`);
                            should(keyValuePairCacheService.retrievePair.calledOnce).be.true(`retrievePair should be called in checkKeyValuePairCache - actual count ${keyValuePairCacheService.retrievePair.callCount}`);
                            should(Promise.delay.calledOnce).be.true(`delay should be called in checkKeyValuePairCache - actual count ${Promise.delay.callCount}`);
                            should(Promise.delay.calledWith(config.featureFlags.pollingPeriod)).be.true('should set polling period from config');
                        });
                });

                it('should return cached value', () => {
                    sandbox.stub(helpers, 'getConfig').returns(config);

                    // set up delayPromise - which can be resolved by calling promiseResolve
                    // this allows us to use Promise.delay stub to check when checkKeyValuePairCache completes
                    let promiseResolve;
                    const delayPromise = new Promise((resolve) => {
                        promiseResolve = resolve;
                    });

                    sandbox.stub(Promise, 'delay').callsFake(() => {
                        promiseResolve(); // signal that processing is completed
                        // reject promise - stops checkKeyValuePairCache from calling itself again
                        return Promise.reject(new Error('stop'));
                    });

                    return Promise.resolve()
                        .then(() => helpers.feature.getAllFlags())
                        .then((res) => {
                            should(res).eql(config.featureFlags, `For first call config should be returned from helpers.getConfig().featureFlags - actual ${res}`);
                            return delayPromise; // wait for Promise.delay to run - which should be end of checkKeyValuePairCache calls
                        })
                        .then(() => {
                            should(helpers.getConfig.callCount).eql(2, `getConfig should be called in body of getAllFlags + in checkKeyValuePairCache - actual count ${helpers.getConfig.callCount}`);
                            should(keyValuePairCacheService.retrievePair.calledOnce).be.true(`retrievePair should be called in checkKeyValuePairCache - actual count ${keyValuePairCacheService.retrievePair.callCount}`);
                            should(Promise.delay.calledOnce).be.true(`delay should be called in checkKeyValuePairCache - actual count ${Promise.delay.callCount}`);
                        })
                        .then(() => helpers.feature.getAllFlags())
                        .then((res) => {
                            should(res).eql(keyValue, `For second call config should be returned from cached value - actual ${res}`);
                        });
                });

                it('should recursively call checkKeyValuePairCache until error returned', () => {
                    sandbox.stub(helpers, 'getConfig').returns(config);

                    // set up delayPromise - which can be resolved by calling promiseResolve
                    // this allows us to use Promise.delay stub to check when checkKeyValuePairCache completes
                    let promiseResolve;
                    const delayPromise = new Promise((resolve) => {
                        promiseResolve = resolve;
                    });

                    // stub Promise.delay - first time just resolves (so checkKeyValuePairCache kicked off again)
                    sandbox.stub(Promise, 'delay')
                        // first call - return resolved promise
                        .onFirstCall().callsFake(() => Promise.resolve())
                        // second call - return rejected promise and set promiseResolve to resolved
                        .onSecondCall().callsFake(() => {
                            promiseResolve(); // signal that processing is completed
                            // reject promise - stops checkKeyValuePairCache from calling itself again
                            return Promise.reject(new Error('stop'));
                        });

                    return Promise.resolve()
                        .then(() => helpers.feature.getAllFlags())
                        .then((res) => {
                            should(res).eql(config.featureFlags, `Config should be returned from helpers.getConfig().featureFlags - actual ${res}`);
                            return delayPromise; // wait for Promise.delay to run - which should be end of checkKeyValuePairCache calls
                        })
                        .then(() => {
                            should(helpers.getConfig.callCount).eql(3, `should be called in body of getAllFlags + in each checkKeyValuePairCache call - actual count ${helpers.getConfig.callCount}`);
                            should(keyValuePairCacheService.retrievePair.calledTwice).be.true(`should be called in each checkKeyValuePairCache call - actual count ${keyValuePairCacheService.retrievePair.callCount}`);
                            should(Promise.delay.calledTwice).be.true(`should be called in each checkKeyValuePairCache call - actual count ${Promise.delay.callCount}`);
                        });
                });

                it('should handle keyvaluepaircacheservice returning error', () => {
                    sssManager = {
                        getService: sandbox.stub().throws(new Error('keyValueError')),
                    };
                    helpers = helpersWrapper(sssManager, framework);
                    sandbox.stub(helpers, 'getConfig').returns(config);

                    // set up delayPromise - which can be resolved by calling promiseResolve
                    // this allows us to use Promise.delay stub to check when checkKeyValuePairCache completes
                    let promiseResolve;
                    const delayPromise = new Promise((resolve) => {
                        promiseResolve = resolve;
                    });

                    sandbox.stub(Promise, 'delay').callsFake(() => {
                        promiseResolve(); // signal that processing is completed
                        // reject promise - stops checkKeyValuePairCache from calling itself again
                        return Promise.reject(new Error('stop'));
                    });

                    return Promise.resolve()
                        .then(() => helpers.feature.getAllFlags())
                        .then((res) => {
                            should(res).eql(config.featureFlags, `Config should be returned from helpers.getConfig().featureFlags - actual ${res}`);
                            return delayPromise; // wait for Promise.delay to run - which should be end of checkKeyValuePairCache calls
                        })
                        .then(() => {
                            should(helpers.getConfig.callCount).eql(2, `should be called in body of getAllFlags + in checkKeyValuePairCache - actual count ${helpers.getConfig.callCount}`);
                            should(keyValuePairCacheService.retrievePair.called).be.false(`checkKeyValuePairCache should not call retrievePair - actual count ${keyValuePairCacheService.retrievePair.callCount}`);
                            should(Promise.delay.calledOnce).be.true(`should be called in checkKeyValuePairCache - actual count ${Promise.delay.callCount}`);
                        });
                });

                it('should default values if keyValuePairCache.retrievePair returns error', () => {
                    sandbox.stub(helpers, 'getConfig').returns(config);
                    retrievePair.rejects(new Error('retrieve Pair error'));

                    // set up delayPromise - which can be resolved by calling promiseResolve
                    // this allows us to use Promise.delay stub to check when checkKeyValuePairCache completes
                    let promiseResolve;
                    const delayPromise = new Promise((resolve) => {
                        promiseResolve = resolve;
                    });

                    sandbox.stub(Promise, 'delay').callsFake(() => {
                        promiseResolve(); // signal that processing is completed
                        // reject promise - stops checkKeyValuePairCache from calling itself again
                        return Promise.reject(new Error('stop'));
                    });

                    return Promise.resolve()
                        .then(() => helpers.feature.getAllFlags())
                        .then((res) => {
                            should(res).eql(config.featureFlags, `Config should be returned from helpers.getConfig().featureFlags - actual ${res}`);
                            return delayPromise; // wait for Promise.delay to run - which should be end of checkKeyValuePairCache calls
                        })
                        .then(() => {
                            should(helpers.getConfig.callCount).eql(3, `getConfig should be called in body of getAllFlags + twice in checkKeyValuePairCache - actual count ${helpers.getConfig.callCount}`);
                            should(keyValuePairCacheService.retrievePair.calledOnce).be.true(`retrievePair should be called in checkKeyValuePairCache - actual count ${keyValuePairCacheService.retrievePair.callCount}`);
                            should(Promise.delay.calledOnce).be.true(`delay should be called in checkKeyValuePairCache - actual count ${Promise.delay.callCount}`);
                            should(Promise.delay.calledWith(config.featureFlags.pollingPeriod)).be.true('should set polling period from config');
                        });
                });

                it('should default polling period if not found in config', () => {
                    const updateConfig = Object.assign({}, config);
                    delete updateConfig.featureFlags.pollingPeriod;
                    sandbox.stub(helpers, 'getConfig').returns(updateConfig);

                    // set up delayPromise - which can be resolved by calling promiseResolve
                    // this allows us to use Promise.delay stub to check when checkKeyValuePairCache completes
                    let promiseResolve;
                    const delayPromise = new Promise((resolve) => {
                        promiseResolve = resolve;
                    });

                    sandbox.stub(Promise, 'delay').callsFake(() => {
                        promiseResolve(); // signal that processing is completed
                        // reject promise - stops checkKeyValuePairCache from calling itself again
                        return Promise.reject(new Error('stop'));
                    });

                    return Promise.resolve()
                        .then(() => helpers.feature.getAllFlags())
                        .then((res) => {
                            should(res).eql(config.featureFlags, `Config should be returned from helpers.getConfig().featureFlags - actual ${res}`);
                            return delayPromise; // wait for Promise.delay to run - which should be end of checkKeyValuePairCache calls
                        })
                        .then(() => {
                            should(helpers.getConfig.callCount).eql(2, `should be called in body of getAllFlags + in checkKeyValuePairCache - actual ${helpers.getConfig.callCount}`);
                            should(keyValuePairCacheService.retrievePair.calledOnce).be.true(`should be called in checkKeyValuePairCache - actual ${keyValuePairCacheService.retrievePair}`);
                            should(Promise.delay.calledOnce).be.true(`should be called in checkKeyValuePairCache - actual ${Promise.delay.callCount}`);
                            should(Promise.delay.calledWith(200)).be.true('should set polling period from config');
                        });
                });
            });
        });
    });

    describe('getConfig', () => {
        it('should retrieve the config', (done) => {
            try {
                should(helpers.getConfig()).eql(config);
                should(framework.common.configuration.get.callCount).eql(1);
                should(framework.common.configuration.get.calledWithExactly()).eql(true);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });
});
