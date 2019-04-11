const JwtCertInfo = require('../../lib/JwtCertInfo');
const { Kid } = require('@sage/sfab-s2s-jwt-kid');
const sinon = require('sinon');
const should = require('should');

describe('@sage/sfab-s2s-jwt-issuer.JwtCertInfo', function() {
    const sandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
    });

    describe('Generate', () => {
        const kid = 'kid';
        const privateKey = 'privateKey';
        const publicKey = 'publicKey';
        const createdAt = 0;

        it('should generate a CertInfo a primary CertInfo', () => {
            sandbox.stub(Kid, 'Generate').returns(kid);
            should(JwtCertInfo.Generate(privateKey, publicKey, createdAt, true)).eql({
                privateKey, publicKey, createdAt, kid, status: 'primary'
            });
        });

        it('should generate a CertInfo a secondary CertInfo', () => {
            sandbox.stub(Kid, 'Generate').returns(kid);
            should(JwtCertInfo.Generate(privateKey, publicKey, createdAt, false)).eql({
                privateKey, publicKey, createdAt, kid, status: 'secondary'
            });
        });

        it('should generate a Kid from the privateKey', () => {
            sandbox.stub(Kid, 'Generate').returns('AAA');

            JwtCertInfo.Generate(privateKey, publicKey, createdAt, false);

            should(Kid.Generate.callCount).eql(1);
            should(Kid.Generate.calledWithExactly(privateKey)).eql(true);
        });
    });
});