const imported = require('../../src/authenticate');
const should = require('should');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const utils  = require('../../src/utils');

const { Authenticate } = imported;

describe('internal-jwt-authenticator.authenticate', function(){
    const logger = {
        info: (msg) => console.log(msg),
        warn: (msg) => console.log(msg),
        error: (msg) => console.error(msg),
    };
    let jwtDecodeStub;
    let cachingServiceSpy;
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
    const cachingService = {
        getCertList: () => certs,
    };
    const cachingServiceErrors = {
        getCertList: () => {throw new Error('getCertListError')},
    };

    before(() => {
        jwtDecodeStub = sinon.stub(jwt, 'decode');
        cachingServiceSpy = sinon.spy(cachingService, 'getCertList');
    });

    afterEach(() => {
       jwtDecodeStub.resetHistory();
    });

    after(() => {
        sinon.restore();
    });

    it('should export the correct modules', () => {
        imported.should.have.only.keys('Authenticate');
    });

    describe('Authenticate.constructor', () => {
        afterEach(() => {
            jwtDecodeStub.resetHistory();
        });

        it('should be able to create new authenticate object', () => {
            jwtDecodeStub.returns({
                exp: 1,
                iss: 'test',
                kid: '12345',
            });

            const test = new Authenticate('authToken', ['valid issuer'], { name: 'caching service'}, logger);

            test.should.be.Object();
            test.should.be.instanceof(Authenticate);
            should.strictEqual(jwtDecodeStub.calledOnce, true);
        });

        it('should throw an error if jwt decode returns null', () => {
            jwtDecodeStub.returns(null);

            should.throws(() => new Authenticate('authToken', ['valid issuer'], { name: 'caching service'}, logger), /invalidAuthToken/);

            should.strictEqual(jwtDecodeStub.calledOnce, true);
        });
    });


    describe('Authenticate.validate', () => {
        let validateTokenStub;

        before(() => {
            validateTokenStub = sinon.stub(utils, 'validateToken');
        });

        it('should resolve to true if validateToken passes ', () => {
            jwtDecodeStub.returns({
               exp: 1,
               iss: 'test',
               kid: '12345',
            });
            validateTokenStub.returns(true);

            const test = new Authenticate('authToken', ['valid issuer'], { name: 'caching service'}, logger);

            return (test.validate()).should.be.fulfilledWith(true);
        });

        it('should reject promise if validateToken fails ', () => {
            jwtDecodeStub.returns({
               exp: 1,
               iss: 'test',
               kid: '12345',
            });
            const errMsg = 'failValidateToken';
            validateTokenStub.throws(() => new Error(errMsg));

            const test = new Authenticate('authToken', ['valid issuer'], { name: 'caching service'}, logger);

            return (test.validate()).should.be.rejectedWith(errMsg);
        });
    });

    describe('Authenticate.populateCertList', () => {
        let test;
        const kid = 'kid1';
        before(() => {
            jwtDecodeStub.returns({
                exp: 1,
                iss: 'test',
                kid,
            });

            test = new Authenticate('authToken', ['valid issuer'], cachingService, logger);
        });

        it('should call caching service populateCertList method', () => {
            const result = test.populateCertList();

            result.should.be.Promise();
            return result.then(() => (cachingServiceSpy.called).should.be.true());
        });

        it('should populate store cert keys', () => {
            const result = test.populateCertList();
            return result
                .then((res) => res.should.eql(certs[kid]))
                .then(() => test.certKeys.should.eql(certs[kid]))
        });

        it('should reject promise if error thrown', () => {
            test = new Authenticate('authToken', ['valid issuer'], cachingServiceErrors, logger);
            const result = test.populateCertList(true);
            return result.should.be.rejectedWith('getCertListError');
        });
    });

    describe('Authenticate.checkAuthorisation', () => {
        let test;
        let anyValidStub;

        const kid = 'kid1';
        before(() => {
            jwtDecodeStub.returns({
                exp: 1,
                iss: 'test',
                kid,
            });

            test = new Authenticate('authToken', ['valid issuer'], cachingService, logger);

            anyValidStub = sinon.stub(utils, 'anyValid');
        });

        const populateCertListSpy = sinon.spy(Authenticate.prototype, 'populateCertList');
        it('should call populateCertList method', () => {
            anyValidStub.returns(true);

            return test.checkAuthorisation()
                .then(() => (populateCertListSpy.called).should.be.true());
        });

        it('should return Authorised if valid token found', () => {
            anyValidStub.returns(true);

            return test.checkAuthorisation()
                .then((res) => res.authorised.should.equal(true));
        });

        it('should reject promise if no valid token found', () => {
            anyValidStub.returns(false);

            return (test.checkAuthorisation()).should.be.rejectedWith('AuthFailed');
        });
    });
});
