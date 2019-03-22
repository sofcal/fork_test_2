const should = require('should');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const Authenticate = require('../../lib/JwtAuthenticator');
const utils  = require('../../lib/utils');
const _ = require('underscore');

describe('module-jwt-authenticator.authenticate', function(){
    const logger = {
        info: (msg) => console.log(msg),
        warn: (msg) => console.log(msg),
        error: (msg) => console.error(msg),
    };
    let jwtDecodeStub;
    let storeServiceSpy;
    let validateTokenUtilsStub;

    const certs = {
        kid1: [
            'cert1',
            'cert2',
        ],
        kid2: [
            'cert3',
            'cert4',
        ],
    };
    class storeServiceClass {
        getValidIds() {}
        getCache() { return Promise.resolve(certs) }
    };
    const storeService = new storeServiceClass();
    const storeServiceErrors = {
        getValidIds: () => {},
        getCache: () => {throw new Error('getCertListError')},
    };
    const storeServiceNoCerts = {
        getValidIds: () => {},
        getCache: () => {return Promise.resolve({})},
    };

    before(() => {
        jwtDecodeStub = sinon.stub(jwt, 'decode');
        storeServiceSpy = sinon.spy(storeServiceClass.prototype, 'getCache');
        validateTokenUtilsStub = sinon.stub(utils, 'validateToken');
    });

    afterEach(() => {
        jwtDecodeStub.reset();
        validateTokenUtilsStub.reset();
    });

    after(() => {
        sinon.restore();
    });

    it('should export the correct modules', () => {
        should.equal(typeof Authenticate, 'function');
    });

    describe('Authenticate.constructor', () => {
        it('should be able to create new authenticate object', () => {
            const test = new Authenticate({
                storeService,
            }, {logger});

            test.should.be.Object();
            test.should.be.instanceof(Authenticate);
        });

        it('should default logger when not passed in', () => {
            const test = new Authenticate({
                storeService,
            });
    
            (test.logger).should.be.a.Object();
            (test.logger).should.have.properties(['info', 'warn', 'error']);
            should.equal(test.logger.error(), undefined);
        });

        it('should be able to create new authenticate object using Authenticate.create', () => {
            const test = Authenticate.Create({
                storeService,
            }, {logger});

            test.should.be.Object();
            test.should.be.instanceof(Authenticate);
        });
    });

    describe('Authenticate.validateToken', () => {

        it('should throw an error for an invalid token', () => {
            jwtDecodeStub.returns(null);

            const test = new Authenticate({
                storeService,
            });

            should.throws(() => test.validateToken('invalid'), /invalidAuthToken/);
        });

        it('should throw an error if unsigned token',() => {
            const dummy = {
                header: { alg: 'none'},
                payload: { iss: 'test' }
            }
            jwtDecodeStub.returns(dummy);
            validateTokenUtilsStub.throws('invalidAuthToken');
            
            const test = new Authenticate({
                storeService,
            });

            should.throws(() => test.validateToken('invalid'), /invalidAuthToken/);            
        });

        it('should return claims from token if validation passes',() => {
            validateTokenUtilsStub.returns(true);
           
            const dummy = {
                header: {alg : 'test'},
                payload: {
                    testClaim: true,
                    exp: Infinity,
                    kid: 'kid',
                    iss: 'iss',
                },
            }
            jwtDecodeStub.returns(dummy);           

            const testValidate = new Authenticate({
                storeService,
            });

            const { testClaim, exp, kid, iss } = testValidate.validateToken('token');            

            should.equal(exp, dummy.payload.exp);
            should.equal(kid, dummy.payload.kid);
            should.equal(iss, dummy.payload.iss);
            should.equal(testClaim, dummy.payload.testClaim);
        });
    });

    describe('Authenticate.validate', () => {
        it('should return true if validate passes ', () => {
            const test = new Authenticate({
                storeService,
            }, {logger});

            should.doesNotThrow(() => test.validate());
        });

        it('should throw error if validate fails ', () => {
            should.throws(() => new Authenticate({
                storeService : {},
            }, {logger}), /^Error: Invalid argument passed: storeService$/);

            should.throws(() => new Authenticate({
                storeService,
            }, {logger: {}}), /^Error: Invalid argument passed: Logger not valid$/);
        });
    });

    describe('Authenticate.getCertKeys', () => {
        let test;
        const kid = 'kid1';

        const payload = {
            exp: Infinity,
            iss: 'test',
            kid: 'kid1',
        };

        before(() => {
            jwtDecodeStub.returns({
                header: {alg : 'test'},
                payload: {
                    exp: Infinity,
                    iss: 'test',
                    kid,
                }
            });

            test = new Authenticate({
                storeService,
            }, {logger});
        });

        it('should call store service getCache method', () => {
            const result = test.getCertKeys(payload);
            result.should.be.Promise();
            return result.then(() => (storeServiceSpy.called).should.be.true());
        });

        it('should call store service getCache method twice if first call does not return data', () => {
            const testEmpty = new Authenticate({
                storeService: storeServiceNoCerts,
            }, {logger});
            return testEmpty.getCertKeys(payload)
                .catch((err) => {
                    storeServiceSpy.calledTwice.should.be.true();
                    should.strictEqual(err.message, 'Error: getCertListError')
                });
        });

        it('should return store cert keys', () => {
            return test.getCertKeys(payload)
                .then((res) => res.should.eql(certs[kid]))
        });

        it('should reject promise if error thrown', () => {
            const testErr = new Authenticate({
                storeService: storeServiceErrors,
            }, {logger});

            const result = testErr.getCertKeys(true);
            return result.should.be.rejectedWith('getCertListError');
        });
    });

    describe('Authenticate.checkAuthorisation', () => {
        let test;
        let validateTokenStub;
        let getCertKeysStub;
        let jwtDecodeStub;

        const payload = {
            testClaim: true,
            exp: Infinity,
            kid: 'kid',
            iss: 'iss',
        };

        before(() => {
            validateTokenStub = sinon.stub(Authenticate.prototype, 'validateToken');
            getCertKeysStub = sinon.stub(Authenticate.prototype, 'getCertKeys');
            jwtDecodeStub = sinon.stub(jwt, 'verify');
            test = new Authenticate({
                storeService,
            }, {logger});
        });

        it('should call getCertKeys method', () => {
            validateTokenStub.returns(payload);
            getCertKeysStub.returns(Promise.resolve([
                'cert1',
                'cert2',
            ]));
            jwtDecodeStub.returns(true);

            return test.checkAuthorisation()
                .then(() => (getCertKeysStub.called).should.be.true());
        });

        it('should return Authorised if valid token found', () => {
            validateTokenStub.returns(payload);
            getCertKeysStub.returns(Promise.resolve([
                'cert1',
                'cert2',
            ]));
            jwtDecodeStub.returns(true);

            return test.checkAuthorisation()
                .then((res) => res.authorised.should.equal(true));
        });

        it('should return Filtered claims if valid token found', () => {
            validateTokenStub.returns(payload);
            getCertKeysStub.returns(Promise.resolve([
                'cert1',
                'cert2',
            ]));
            jwtDecodeStub.returns(true);

            return test.checkAuthorisation()
                .then((res) => res.claims.should.have.properties(['kid', 'testClaim']));
        });

        it('should reject promise if no certificates found for issuer', () => {
            validateTokenStub.returns(payload);
            getCertKeysStub.returns(Promise.resolve([]));

            return (test.checkAuthorisation()).should.be.rejectedWith('AuthFailed');
        });

        it('should reject promise if no valid token found', () => {
            validateTokenStub.returns(payload);
            getCertKeysStub.returns(Promise.resolve([
                'cert1',
                'cert2',
            ]));
            jwtDecodeStub.throws(new Error);

            return (test.checkAuthorisation()).should.be.rejectedWith('AuthFailed');
        });
    });
});
