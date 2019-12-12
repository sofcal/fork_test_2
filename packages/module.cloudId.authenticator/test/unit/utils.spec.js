const should = require('should');
const sinon = require('sinon');
const utils = require('../../lib/utils');

const {
    expired,
    issuerInvalid,
    validateToken,
} = utils;

describe('@sage/sfab-s2s-cloudId-authenticator.utils', () => {
    it('should export the correct modules', (done) => {
        utils.should.have.only.keys(
            'expired',
            'issuerInvalid',
            'validateToken',
            'audienceInvalid',
            'audienceInvalid'
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
        let expiredStub;
        let issuerInvalidStub;

        const token = {
            header: { alg: 'RS256'},
            payload: {
                iss: 'testa',
                aud: 'testa',
                azp: 'testa',
                exp: 0,
            }
        }
        const validIssuers = ['testa', 'testb', 'testc'];
        const validAudiences = ['testa', 'testb', 'testc'];
        const validClients = ['testa', 'testb', 'testc'];

        before(() => {
            expiredStub = sinon.stub(utils, 'expired');
            issuerInvalidStub = sinon.stub(utils, 'issuerInvalid');
        });

        after(() => {
            sinon.restore();
        });

        it('Throws authTokenExpired error when auth token expired', () => {
            expiredStub.returns(true);
            issuerInvalidStub.returns(false);

            should.throws(() => validateToken(token, validIssuers), /^Error: authTokenExpired$/);
        });

        it('Throws authTokenIssuerInvalid error when issuer invalid', () => {
            expiredStub.returns(false);
            issuerInvalidStub.returns(true);

            should.throws(() => validateToken(token, validIssuers), /^Error: authTokenIssuerInvalid$/);
        });

        it('Throws invalidAuthToken error when token unsigned', () => {
            expiredStub.returns(false);
            issuerInvalidStub.returns(false);
            const unsignedToken = Object.assign(
                {},
                token,
                {
                    header: {alg: 'none'},
                    payload: {
                        iss: 'testa',
                        aud: 'testa',
                        azp: 'testa'
                    }
                }
            )

            should.throws(() => validateToken(unsignedToken, validIssuers, validAudiences, validClients), /^Error: invalidAuthToken$/);
        });

        // check defaults populated
        it('should default to unsigned token, and fail validation', () => {
            expiredStub.returns(false);
            issuerInvalidStub.returns(false);

            should.throws(() => validateToken(undefined, validIssuers, validAudiences, validClients), /^Error: invalidAuthToken$/);
        })

        it('Returns true when auth token valid', () => {
            expiredStub.returns(false);
            issuerInvalidStub.returns(false);

            should.strictEqual(validateToken(token, validIssuers, validAudiences, validClients), true);
        });
    });
});
