const should = require('should');
const sinon = require('sinon');
const utils = require('../../src/utils');

const {
    expired,
    issuerInvalid,
    validateToken,
    anyValid,
    partial,
} = utils;

describe('utils', () => {
    it('should export the correct modules', (done) => {
        utils.should.have.only.keys('expired', 'issuerInvalid', 'validateToken', 'anyValid', 'partial');
        done();
    });

    describe('expired', () => {
        before(() => {
            // sinon.stub(Date, 'now').returns(1000000);
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

    describe('anyValid', () => {
        const arr = [1,2,3,4];
        const predicate = {
            alwaysThrow : () => {throw new Error('false')},
            throwIfLessThan3: (x) => {if (x < 3) throw new Error('Less than 3')}
        };
        let alwaysThrowSpy;
        let throwIfLessThan3Spy;

        before(() => {
            alwaysThrowSpy = sinon.spy(predicate, "alwaysThrow");
            throwIfLessThan3Spy = sinon.spy(predicate, "throwIfLessThan3");
        });

        afterEach(() => {
            alwaysThrowSpy.resetHistory();
            throwIfLessThan3Spy.resetHistory();
        });

        after(() => {
            sinon.restore();
        });

        it('Should return false when no values pass test', () => {
            should.strictEqual(anyValid(arr, alwaysThrowSpy), false);
        });

        it('Should call predicate for each entry when all fail', () => {
            anyValid(arr, alwaysThrowSpy);
            should.strictEqual(alwaysThrowSpy.alwaysThrew(), true);
            should.strictEqual(alwaysThrowSpy.callCount, arr.length);
        });

        it('Should return true when values pass test', () => {
            should.strictEqual(anyValid(arr, throwIfLessThan3Spy), true);
        });

        it('Should call predicate until first value passes', () => {
            anyValid(arr, throwIfLessThan3Spy);
            should.strictEqual(throwIfLessThan3Spy.threw(), true);
            should.strictEqual(throwIfLessThan3Spy.callCount, 3);
        });
    });

    describe('partial', () => {
        const testFn = (...args) => args.length;
        const testFnSpy = sinon.spy(testFn);


        afterEach(() => {
            testFnSpy.resetHistory();
        });

        it('Returns a function', () => {
            (partial(testFn, 'dummy')).should.be.Function();
        });

        it('Should not call function', () => {
            partial(testFn, 'dummy');
            should.strictEqual(testFnSpy.callCount, 0);
        });

        it('Sets correct number of arguments', () => {
            const fn = partial(testFn, 'dummy1');
            const result = fn('dummy2');
            should.strictEqual(result, 2);
        });
    });
});
