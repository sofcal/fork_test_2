const should = require('should');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const Authenticate = require('../../lib/CloudIdAuthenticator');
const utils  = require('../../lib/utils');
const _ = require('underscore');

describe('@sage/sfab-s2s-cloudId-authenticator.cloudIdAuthenticator', function(){
    const logger = {
        info: (msg) => console.log(msg),
        warn: (msg) => console.log(msg),
        error: (msg) => console.error(msg),
    };
    let jwtDecodeStub;
    let jwtVerifyStub;
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

    before(() => {
        jwtDecodeStub = sinon.stub(jwt, 'decode');
        jwtVerifyStub = sinon.stub(jwt, 'verify');
        validateTokenUtilsStub = sinon.stub(utils, 'validateToken');
    });

    afterEach(() => {
        jwtDecodeStub.reset();
        jwtVerifyStub.reset();
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

            const test = new Authenticate(
                {validIssuer: 'a', validAudiences: 'a', validClients: 'a', validScopes: 'a'}, {logger});

            test.should.be.Object();
            test.should.be.instanceof(Authenticate);
        });

        it('should default logger when not passed in', () => {
            const test = new Authenticate(
                {validIssuer: 'a', validAudiences: 'a', validClients: 'a', validScopes: 'a'}, {}
            );

            (test.logger).should.be.a.Object();
            (test.logger).should.have.properties(['info', 'warn', 'error']);
            should.equal(test.logger.error(), undefined);
        });

        it('should be able to create new authenticate object using Authenticate.create', () => {
            const test = Authenticate.Create(
                {validIssuer: 'a', validAudiences: 'a', validClients: 'a', validScopes: 'a'}
            , {logger});

            test.should.be.Object();
            test.should.be.instanceof(Authenticate);
        });

        it('should fail is a valid issuer is not passed in', () => {
           try {
               Authenticate.Create({validAudiences: 'a', validClients: 'a', validScopes: 'a'}
                   , {logger});
           } catch (e) {
               e.message.should.eql('Invalid argument passed: issuer');
           }
        });

        it('should fail if a valid audience is not passed in', () => {
            try {
                Authenticate.Create({validIssuer: 'a', validClients: 'a', validScopes: 'a'}
                    , {logger});
            } catch (e) {
                e.message.should.eql('Invalid argument passed: audiences');
            }
        });

    });

    describe('Authenticate.validateToken', () => {

        it('should throw an error for an invalid token', () => {
            jwtDecodeStub.returns(null);

            const test = new Authenticate({validIssuer: 'a', validAudiences: 'a', validClients: 'a', validScopes: 'a'}, {});

            should.throws(() => test.validateToken('invalid'), /invalidAuthToken/);
        });

        it('should throw an error if unsigned token',() => {
            const dummy = {
                header: { alg: 'none'},
                payload: { iss: 'test' }
            };
            jwtDecodeStub.returns(dummy);
            validateTokenUtilsStub.throws('invalidAuthToken');

            const test = new Authenticate({validIssuer: 'a', validAudiences: 'a', validClients: 'a', validScopes: 'a'}, {});

            should.throws(() => test.validateToken('invalid'), /invalidAuthToken/);
        });

        it('should return claims from token if validation passes',() => {
            validateTokenUtilsStub.returns(true);

            const dummy = {
                header: {alg : 'test'},
                payload: {
                    testClaim: true,
                    kid: 'kid',
                    iss: 'iss',
                    aud: 'aud',
                    azp: 'azp'
                },
            };
            jwtDecodeStub.returns(dummy);

            const testValidate = new Authenticate({validIssuer: 'iaa', validAudiences: 'aud', validClients: 'azp', validScopes: 'scope'},  {});
            const decoded = testValidate.validateToken('token');
            const { payload: {testClaim, exp, kid, iss, aud, azp }} = decoded;

            should.equal(exp, dummy.payload.exp);
            should.equal(kid, dummy.payload.kid);
            should.equal(iss, dummy.payload.iss);
            should.equal(aud, dummy.payload.aud);
            should.equal(azp, dummy.payload.azp);
            should.equal(testClaim, dummy.payload.testClaim);
        });
    });

    describe('Authenticate.validate', () => {
        it('should return true if validate passes ', () => {
            const test = new Authenticate({validIssuer: 'a', validAudiences: 'a', validClients: 'a', validScopes: 'a'}, {}, {logger});

            should.doesNotThrow(() => test.validate());
        });

        it('should throw error if validate fails ', () => {
            should.throws(() => new Authenticate(
                { validAudiences: 'a', validClients: 'a', validScopes: 'a' }, {}, {logger}), /^Error: Invalid argument passed: issuer$/);
        });
    });

    describe.skip('Authenticate.getSigningKeys', () => {
        let test;
        const kid = 'kid1';

        const payload = {
            exp: Infinity,
            iss: 'test',
            kid: 'kid1',
        };

        before(() => {
            jwtDecodeStub.returns('test');
            const jwksStub = { getSigningKey: sinon.stub() };
            jwksStub.getSigningKey.returns('123');
            test = new Authenticate('a', 'a', 'a', jwksStub, {logger});
        });

        it('should return Signing Keys', () => {
            return test.getSigningKey(payload.kid)
                .then((res) => {
                    res.should.eql(certs[kid])
                })
        });

        it('should reject promise if error thrown', () => {
            const testErr = new Authenticate('a', 'a', 'a',  {logger});

            const result = testErr.getCertKeys(true);
            return result.should.be.rejectedWith('getCertListError');
        });
    });

    describe.skip('Authenticate.verifyToken', () => {
        const kid = 'kid1';

        const payload = {
            exp: Infinity,
            iss: 'test',
            kid: 'kid1',
        };

        before(() => {
            jwtVerifyStub = sinon.stub(jwt, 'verify');
            jwtVerifyStub.returns({
                header: {alg : 'test'},
                payload: {
                    exp: Infinity,
                    iss: 'test',
                    kid,
                }
            });
        });

        after(() => {
            jwtVerifyStub.restore();
        });


        it('should return store cert keys', () => {

            const test = new Authenticate('a', 'b', 'c', {logger});
            return test.verifyToken(payload, 'signature')
                .then((res) => {
                    res.should.eql(certs[kid])
                })
        });

        it('should reject promise if error thrown', () => {

            const test = new Authenticate('a', 'b', 'c', {logger});
            const result = test.verifyToken(payload, 'signature');
            return result.should.be.rejectedWith('getCertListError');
        });
    });

    describe.skip('Authenticate.checkAuthorisation', () => {
        let test;
        let validateTokenStub;
        let getSigningKeyStub;
        let verifyTokenStub;

        const payload = {
            testClaim: true,
            exp: Infinity,
            kid: 'kid',
            iss: 'iss',
        };

        before(() => {
            validateTokenStub = sinon.stub(Authenticate, 'validateToken').returns(payload);
            verifyTokenStub = sinon.stub(Authenticate, 'verifyToken').resolves(payload);
            getSigningKeyStub = sinon.stub(Authenticate, 'getSigningKey').resolves([
                'cert1',
                'cert2',
            ]);
            test = new Authenticate('a', 'b', 'c', {logger});
        });

        it('should call validateTokenStub method', () => {

            return test.checkAuthorisation()
                .then(() => (validateTokenStub.called).should.be.true());
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
