const should = require('should');
const sinon = require('sinon');
const utils = require('../../lib/utils');

const {
    expired,
    issuerInvalid,
    validateToken,
} = utils;

describe('utils', () => {
    it('should export the correct modules', (done) => {
        utils.should.have.only.keys(
            'expired',
            'issuerInvalid',
            'validateToken'
        );
        done();
    });

    describe('expired', () => {
        before(() => {
            sinon.stub(Date, 'now').returns(10000); // 10 seconds
        });

        after(() => {
            sinon.restore();
        });

        it('Should return true when exp < current time', () => {
            const exp = 1;
            should.strictEqual(expired(exp), true);
        });

        it('Should return false when exp > current time', () => {
            const exp = 2000;
            should.strictEqual(expired(exp), false);
        });

        it('Should return false when exp = current time', () => {
            const exp = (Date.now() / 1000);
            should.strictEqual(expired(exp), false);
        });
    });

    describe('issuerInvalid', () => {
        it('Should return false when issuer in list', () => {
            const list = ['a', 'b', 'c'];
            const issuer = 'a';
            should.strictEqual(issuerInvalid(issuer, list), false);
        });
        it('Should return true when issuer not in list', () => {
            const list = ['a', 'b', 'c'];
            const issuer = 'd';
            should.strictEqual(issuerInvalid(issuer, list), true);
        });
        it('Should return true when no valid issuers', () => {
            const list = [];
            const issuer = 'a';
            should.strictEqual(issuerInvalid(issuer, list), true);
        });
    });

    describe('validateToken', () => {
        let exp;
        let iss;
        let validIssuers;

        let expiredStub;
        let issuerInvalidStub;

        before(() => {
            expiredStub = sinon.stub(utils, 'expired');
            issuerInvalidStub = sinon.stub(utils, 'issuerInvalid');
        });

        after(() => {
            sinon.restore();
        });

        it('Throws authTokenExpired error when auth token expired', () => {
            exp = 0;
            iss = 'a';
            validIssuers = ['a', 'b', 'c'];
            expiredStub.returns(true);
            issuerInvalidStub.returns(false);

            should.throws(() => validateToken(exp, iss, validIssuers), /^Error: authTokenExpired$/);
        });

        it('Throws authTokenIssuerInvalid error when issuer invalid', () => {
            exp = 0;
            iss = 'a';
            validIssuers = ['a', 'b', 'c'];
            expiredStub.returns(false);
            issuerInvalidStub.returns(true);

            should.throws(() => validateToken(exp, iss, validIssuers), /^Error: authTokenIssuerInvalid$/);
        });

        it('Returns true when auth token expired', () => {
            exp = 0;
            iss = 'a';
            validIssuers = ['a', 'b', 'c'];
            expiredStub.returns(false);
            issuerInvalidStub.returns(false);

            should.strictEqual(validateToken(exp, iss, validIssuers), true);
        });
    });
});
