const imported = require('../../src/authenticate');
const should = require('should');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const utils  = require('../../src/utils');

const { Authenticate } = imported;

describe('internal-jwt-authenticator.authenticate', function(){
    let jwtDecodeStub;

    before(() => {
        jwtDecodeStub = sinon.stub(jwt, 'decode');
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

            const test = new Authenticate('authToken', ['valid issuer'], { name: 'caching service'});

            test.should.be.Object();
            test.should.be.instanceof(Authenticate);
            should.strictEqual(jwtDecodeStub.calledOnce, true);
        });

        it('should throw an error if jwt decode fails', () => {
            jwtDecodeStub.throws();

            should.throws(() => new Authenticate('authToken', ['valid issuer'], { name: 'caching service'}), /invalidAuthToken/);

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

            const test = new Authenticate('authToken', ['valid issuer'], { name: 'caching service'});

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

            const test = new Authenticate('authToken', ['valid issuer'], { name: 'caching service'});

            return (test.validate()).should.be.rejectedWith(errMsg);
        });
    });

    describe('Authenticate.getCertList', () => {

        it('should call caching service getCertList method');

        it('should populate store cert keys');

        it('should reject promise if error thrown');
    });

    describe('Authenticate.checkAuthorisation', () => {
        it('should call getCertList method');

        it('should return Authorised if valid token found');

        it('should reject promise if no valid token found');
    });
});
