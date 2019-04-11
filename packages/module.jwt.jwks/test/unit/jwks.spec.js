const Jwks = require('../../lib/Jwks');
const { Kid } = require('@sage/sfab-s2s-jwt-kid');
const should = require('should');
const sinon = require('sinon');

describe('@sage/sfab-s2s-jwt-jwks.Jwks', function() {
    const sandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
    });

    describe('Generate', () => {
        const x5c = 'X5C';
        const idKey = 'idKey';
        const kid = 'AAA';
        const expected = { kty: 'RSA', alg: 'RS256', use: 'sig', kid, x5c: [x5c] };

        it('should generate a JWKS', () => {
            sandbox.stub(Kid, 'Generate').returns('AAA');
            sandbox.stub(Jwks, 'ConvertPemToX5C').returns(x5c);

            should(Jwks.Generate(x5c, idKey)).eql(expected);
        });

        it('should generate a Kid from the idKey', () => {
            sandbox.stub(Kid, 'Generate').returns('AAA');
            sandbox.stub(Jwks, 'ConvertPemToX5C').returns(x5c);

            Jwks.Generate(x5c, idKey);

            should(Kid.Generate.callCount).eql(1);
            should(Kid.Generate.calledWithExactly(idKey)).eql(true);
        });

        it('should convert the key to x5c', () => {
            sandbox.stub(Kid, 'Generate').returns('AAA');
            sandbox.stub(Jwks, 'ConvertPemToX5C').returns(x5c);

            Jwks.Generate(x5c, idKey);

            should(Jwks.ConvertPemToX5C.callCount).eql(1);
            should(Jwks.ConvertPemToX5C.calledWithExactly(x5c, false)).eql(true);
        });
    });

    describe('ConvertPemToX5C', () => {
        const x5c = 'X5C';

        // since strings are immutable our tests can directly check that the results eql the source

        it('should not modify a key already in the x5c format', () => {
            should(Jwks.ConvertPemToX5C(x5c)).eql(x5c);
        });

        it('should convert a standard rsa pem to x5c', () => {
            const key = `-----BEGIN RSA PUBLIC KEY-----${x5c}-----END RSA PUBLIC KEY-----`;
            should(Jwks.ConvertPemToX5C(key)).eql(x5c);
        });

        it('should remove all space/newline/tab characters', () => {
            const key = `\n\n\n-----BEGIN RSA PUBLIC KEY-----\r\n${x5c}\r\r\r\r\n\n\n\n\t\t\t-----END RSA PUBLIC KEY-----\n\r\t`;
            should(Jwks.ConvertPemToX5C(key)).eql(x5c);
        });

        it('should convert an openssl pem to x5c', () => {
            // openssl pems have a different prefix, and 32 base64 characters of encoding information as preamble
            const key = `-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A${x5c}-----END PUBLIC KEY-----`;
            should(Jwks.ConvertPemToX5C(key, true)).eql(x5c);
        })
    });

    describe('ConvertX5CToPem', () => {
        const x5c = 'MIIBCgKCAQEAgXyKsdOX5mpr7upoIpDEw3azZL3+KWFWXcNqTRoTGVdQ7iA2p5NpOUp7RClj6qXRk388CLJ2mzeiy4GqGgw/QsQtXvgVzI3yOAfgZEpUY/YR0gS8tUNgDm5VZtDK4lFosDVdYP89tcYEnOziWk1Cmzs3NC0Rjru2FRxcVMLNiUb3GXDe0lzTTNVA4tA0C5522gAMwBUbrMrblQzRSFgnok6UamNt7GkHIiZeguVkFWXzVgOKyJY9X5FiaQqtlK0z60JNUlaboIIltsCNcpicQmXqaT6h3iNXmX02al0k9/SyCuyUi4sDiDsH9TDmFu2YtDgwlyYk9GmZZBef3TG2fwIDAQAB';
        const pem = `-----BEGIN RSA PUBLIC KEY-----\n${x5c.replace(/(.{64})/g, '$1\n')}\n-----END RSA PUBLIC KEY-----`;

        it('should not modify a key already in pem format', () => {
            should(Jwks.ConvertX5CToPem(pem)).eql(pem);
        });

        it('should convert a x5c to pem', () => {
            should(Jwks.ConvertX5CToPem(x5c)).eql(pem);
        });

        it('should remove all additional space/newline/tab characters', () => {
            should(Jwks.ConvertX5CToPem(x5c.replace(/(.{12})/g, '$1\n\r\r\t\t\t\n\n\n\n'))).eql(pem);
        });
    });

    describe('isExpired', () => {
        const maxAgeSeconds = 120;

        it('should be false if createdAt plus maxAgeSeconds is less than now', () => {
            sandbox.useFakeTimers((maxAgeSeconds - 1) * 1000);
            const createdAt = 0;
            should(Jwks.isExpired(createdAt, maxAgeSeconds)).eql(false);
        });

        it('should be false if createdAt plus maxAgeSeconds is equal to now', () => {
            sandbox.useFakeTimers((maxAgeSeconds) * 1000);
            const createdAt = 0;
            should(Jwks.isExpired(createdAt, maxAgeSeconds)).eql(false);
        });

        it('should be false if createdAt plus maxAgeSeconds is equal to now (boundary)', () => {
            sandbox.useFakeTimers((maxAgeSeconds * 1000) + 999);
            const createdAt = 0;
            should(Jwks.isExpired(createdAt, maxAgeSeconds)).eql(false);
        });

        it('should be true if createdAt plus maxAgeSeconds is greater than now', () => {
            sandbox.useFakeTimers((maxAgeSeconds + 1) * 1000);
            const createdAt = 0;
            should(Jwks.isExpired(createdAt, maxAgeSeconds)).eql(true);
        });
    });

    describe('isValid', () => {
        it('should return true if all fields are valid', () => {
            sandbox.stub(Jwks, 'isExpired').returns(false);
            should(Jwks.isValid('publicKey', 'keyToUseForKid', 1, 1)).eql(true);
        });

        it('should return false if isExpired', () => {
            sandbox.stub(Jwks, 'isExpired').returns(true);
            should(Jwks.isValid('publicKey', 'keyToUseForKid', 1, 1)).eql(false);
        });

        it('should return false if publicKey is not a string (null)', () => {
            sandbox.stub(Jwks, 'isExpired').returns(false);
            should(Jwks.isValid(null, 'keyToUseForKid', 1, 1)).eql(false);
        });

        it('should return false if publicKey is not a string (undefined)', () => {
            sandbox.stub(Jwks, 'isExpired').returns(false);
            should(Jwks.isValid(undefined, 'keyToUseForKid', 1, 1)).eql(false);
        });

        it('should return false if publicKey is not a string (object)', () => {
            sandbox.stub(Jwks, 'isExpired').returns(false);
            should(Jwks.isValid({}, 'keyToUseForKid', 1, 1)).eql(false);
        });

        it('should return false if publicKey is not a string (bool)', () => {
            sandbox.stub(Jwks, 'isExpired').returns(false);
            should(Jwks.isValid(false, 'keyToUseForKid', 1, 1)).eql(false);
        });

        it('should return false if publicKey is not a string (number)', () => {
            sandbox.stub(Jwks, 'isExpired').returns(false);
            should(Jwks.isValid(0, 'keyToUseForKid', 1, 1)).eql(false);
        });


        it('should return false if keyToUseForKid is not a string (null)', () => {
            sandbox.stub(Jwks, 'isExpired').returns(false);
            should(Jwks.isValid('publicKey', null, 1, 1)).eql(false);
        });

        it('should return false if keyToUseForKid is not a string (undefined)', () => {
            sandbox.stub(Jwks, 'isExpired').returns(false);
            should(Jwks.isValid('publicKey', undefined, 1, 1)).eql(false);
        });

        it('should return false if keyToUseForKid is not a string (object)', () => {
            sandbox.stub(Jwks, 'isExpired').returns(false);
            should(Jwks.isValid('publicKey', {}, 1, 1)).eql(false);
        });

        it('should return false if keyToUseForKid is not a string (bool)', () => {
            sandbox.stub(Jwks, 'isExpired').returns(false);
            should(Jwks.isValid('publicKey', true, 1, 1)).eql(false);
        });

        it('should return false if keyToUseForKid is not a string (number)', () => {
            sandbox.stub(Jwks, 'isExpired').returns(false);
            should(Jwks.isValid('publicKey', 201, 1, 1)).eql(false);
        });
    });
});