'use strict';

const JWTIssuer = require('../../lib/JWTIssuer');
const jwt = require('jsonwebtoken');
const Promise = require('bluebird');
const sinon = require('sinon');
const should = require('should');

describe('@sage/sfab-s2s-jwt-issuer.JWTIssuer', function() {

    const sandbox = sinon.sandbox.create();
    const cache = {
        getData: () => Promise.reject(new Error('not implemented'))
    };

    const primaryKey = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC62czXecWutX6I\ns3bT3vVLJTaesaBajK/mIu0FBB8xs1J0taWZJ1PNRIk3EnlJlCF2UJAajA+6z5bQ\nXXM+yiCbZLAgOwaVOpr41M5mBGclY186e6HLK60bY9MIIYr0xbC4fq2Nbr/M5JFy\nE6UbrnDQPOVzTb+++jKTUj9ZRagN6sNzhjCdOnJPRcjTGVRlm9Ly9Rwf+zwiec49\nK06nAcyV73KclWOU1oRihUGKuir45HWfn1TU1C/UcrbT04oZPwSpRrTPeWdRz5sW\ni5Yy1s41ZKg0GIBaiJfMp5vbmJMxbHzNAToTrM+BsY+QD51wuEI75hErYw1WsuV9\nyK9WUrFjAgMBAAECggEAdZ5AiasHuzBYVGjT9g61TfZA6ahajmVdHHsDxFKR6FE/\nKGRnt37AC8iGr3obiyuJ3NZdv7hG9otSHhuVPgMyf17kV4WQYUOg5d3fhuximXBy\nM3g7oo79yu4Nm2Kx+96tnZVwXkVGyw1eWPbwyfoG3a5XqTtZ5jfMulvdsK5eWVNJ\nA2tr+usdNtIX4VffHQowPodyAMHHB1U/W2yczZVEjksEpL0gu2NqtEdSAVPvyDC4\ni3q7APAt68DwWe0HkLKrjag5Gu1SO03WbV341yufoVlQlVcCCusrQ61o4Uyz8DVv\n7CEMYirJqxe7DcbajylktN7+/mZxOa6xPmYDS4az8QKBgQDgD+QRvDLWP99XvF0L\nCwC5AP28VBi7h9Et+iEyqfpJuCoq3WyKubJCYraPa20SdnBFUG5s7s8JrFCX56ZB\nS1xUoeX46QrIK1wXKqmlMEh+iPFVqT7XshAvXNm6gusodPq5Ov8GSUS7IFuvxp27\nhiF29d3Zj7Spau4dsMI6RNKvjQKBgQDVfA4mIyX3RLWYH+igvvcCNgeauOKQ1Kpl\ngSGp8XluHjLGpl0swCjMtJ81uT8dOZYUD5PBfSDLlRIsD3PbJJ+6qbbMiTk11vV4\nwauqzobF2Cfm1hzRcNl4/NZz5wuuvgZCf97HQxVDOEJQS3/a53MJ+/peEsR4vudZ\n/qYQSDtwrwKBgCsQYtFVzp+HHzIJrghVUQo9uobb0vUYIYgorwDB0q0gjFo4vIfd\nMPm5Z0UhbJFD2kg4MUEWlQxS5hqMF1QtW82YYE7622ulicmaFYj+QrCvOVMxeDaU\nrq+rtN04FGJuOVIomKNoqaEdkwGxttc37G6kysLp79swBhwGwQ3Z9HRxAoGBAKMR\nm40uE/YImd2VohAHTo51zuE0kHuotm/Kb3hsZyDiGE79DPb94SxcW7Chy7/7GNRC\nAc8uUTqwp6zYMNsX4pqmwGcD+ptRkzemWAaksvW04uXEb0bcOIHeP8FQnu/fXtC0\n8+qpJzitZJoI0aTYXlsmClyJYWIKEJYBmb+eLSkpAoGAVLSgQYnoo9OS3kZpYTFE\ncgK1w+JNDgHIKctqjpPVrsWpOh5/Ml3vnZIBMRxo74yx0FX+rSJlYoRbcViUNlfz\nDQG32pl0BHHmVc9B80ytdckIFDfeqxy7pemZ7wH70CXd9dIhhkEkxXDz55AU1ctn\nOcvG+ovZCNfFKgpNeZwLMEk=\n-----END PRIVATE KEY-----';
    const defaultData = [{
        status: 'primary',
        private: 'primary_private',
        public: 'primary_public',
        timestamp: 0, // 0 is the epoch, so our default newCertDelay value won't impact it
        kid: 'primary_kid'
    }, {
        status: 'secondary',
        private: 'secondary_private',
        public: 'secondary_public',
        timestamp: 0, // 0 is the epoch, so our default newCertDelay value won't impact it
        kid: 'secondary_kid'
    }];

    const serviceId = 'sage.servicefabric.banking';

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should create an instance of JWTIssuer', () => {
            const actual = new JWTIssuer(cache, { iss: serviceId, newCertDelay: 100 } );
            should(actual).be.an.instanceof(JWTIssuer);
        });

        it('should assign properties', () => {
            const actual = new JWTIssuer(cache, { iss: serviceId, newCertDelay: 100 } );
            should(actual.cache).eql(cache);
            should(actual.newCertDelay).eql(100);
            should(actual.iss).eql(serviceId);
        });

        it('should throw an error if cache is not set', () => {
            should(() => new JWTIssuer(null, { iss: serviceId, newCertDelay: 100 } ))
                .throwError(new Error('invalid cache: expected object with getData function'));
        });

        it('should throw an error if cache does not contain a getData function', () => {
            should(() => new JWTIssuer({ }, { iss: serviceId, newCertDelay: 100 } ))
                .throwError(new Error('invalid cache: expected object with getData function'));
        });

        it('should throw an error if iss is not set', () => {
            should(() => new JWTIssuer(cache, { iss: null, newCertDelay: 100 } ))
                .throwError(new Error('invalid iss: expected string'));
        });

        it('should throw an error if iss is not a string', () => {
            should(() => new JWTIssuer(cache, { iss: 9, newCertDelay: 100 } ))
                .throwError(new Error('invalid iss: expected string'));
        });

        it('should throw and error if newCertDelay is not set', () => {
            should(() => new JWTIssuer(cache, { iss: serviceId, newCertDelay: null } ))
                .throwError(new Error('invalid newCertDelay: expected number of seconds'));
        });

        it('should throw and error if newCertDelay is not a number', () => {
            should(() => new JWTIssuer(cache, { iss: serviceId, newCertDelay: 'string' } ))
                .throwError(new Error('invalid newCertDelay: expected number of seconds'));
        });
    });

    describe('generate', () => {
        it('should include an exp claim which contains the expiration timestamp of the token', () => {
            const now = Date.now();

            sandbox.stub(defaultData[0], 'private').value(primaryKey);
            sandbox.stub(cache, 'getData').resolves(defaultData);
            sandbox.useFakeTimers(now);

            const claims = {};
            const expiresIn = 1000;

            const issuer = new JWTIssuer(cache, { iss: serviceId, newCertDelay: 100 } );
            return issuer.generate({ claims, expiresIn, algorithm: JWTIssuer.Algortithms.RS256 })
                .then((actual) => {
                    const decoded = jwt.decode(actual);
                    const nowS = Math.floor(now / 1000);
                    should(decoded.exp).eql(nowS + expiresIn);
                });
        });

        it('should include an iat claim which contains the timestamp of when the token was issued', () => {
            const now = Date.now();

            sandbox.stub(defaultData[0], 'private').value(primaryKey);
            sandbox.stub(cache, 'getData').resolves(defaultData);
            sandbox.useFakeTimers(now);

            const claims = {};
            const expiresIn = 1000;

            const issuer = new JWTIssuer(cache, { iss: serviceId, newCertDelay: 100 });
            return issuer.generate({ claims, expiresIn, algorithm: JWTIssuer.Algortithms.RS256 })
                .then((actual) => {
                    const decoded = jwt.decode(actual);
                    const nowS = Math.floor(now / 1000);
                    should(decoded.iat).eql(nowS);
                });
        });

        it('should include an iss claim which contains the service Id', () => {
            const now = Date.now();

            sandbox.stub(defaultData[0], 'private').value(primaryKey);
            sandbox.stub(cache, 'getData').resolves(defaultData);
            sandbox.useFakeTimers(now);

            const claims = {};
            const expiresIn = 1000;

            const issuer = new JWTIssuer(cache, { iss: serviceId, newCertDelay: 100 });
            return issuer.generate({ claims, expiresIn, algorithm: JWTIssuer.Algortithms.RS256 })
                .then((actual) => {
                    const decoded = jwt.decode(actual);
                    should(decoded.iss).eql(serviceId);
                });
        });

        it('should include a kid claim which contains the identifier of the certificate used to sign the JWT', () => {
            const now = Date.now();

            sandbox.stub(defaultData[0], 'private').value(primaryKey);
            sandbox.stub(cache, 'getData').resolves(defaultData);
            sandbox.useFakeTimers(now);

            const claims = {};
            const expiresIn = 1000;

            const issuer = new JWTIssuer(cache, { iss: serviceId, newCertDelay: 100 });
            return issuer.generate({ claims, expiresIn, algorithm: JWTIssuer.Algortithms.RS256 })
                .then((actual) => {
                    const decoded = jwt.decode(actual);
                    should(decoded.kid).eql(defaultData[0].kid);
                });
        });

        it('should include additional claims', () => {
            const now = Date.now();

            sandbox.stub(defaultData[0], 'private').value(primaryKey);
            sandbox.stub(cache, 'getData').resolves(defaultData);
            sandbox.useFakeTimers(now);

            const claims = { claim1: 'claim_1', claim2: 'claim_2' };
            const expiresIn = 1000;

            const issuer = new JWTIssuer(cache, { iss: serviceId, newCertDelay: 100 });
            return issuer.generate({ claims, expiresIn, algorithm: JWTIssuer.Algortithms.RS256 })
                .then((actual) => {
                    const decoded = jwt.decode(actual);
                    should(decoded.claim1).eql('claim_1');
                    should(decoded.claim2).eql('claim_2');
                });
        });

        it('should retrieve certs from the cache on every call', () => {
            const now = Date.now();

            sandbox.stub(defaultData[0], 'private').value(primaryKey);
            sandbox.stub(cache, 'getData').resolves(defaultData);
            sandbox.useFakeTimers(now);

            const claims = { };
            const expiresIn = 1000;

            const issuer = new JWTIssuer(cache, { iss: serviceId, newCertDelay: 100 });
            return issuer.generate({ claims, expiresIn, algorithm: JWTIssuer.Algortithms.RS256 })
                .then(() => {
                    should(cache.getData.callCount).eql(1);
                });
        });

        it('should delay usage of a new certificate for X seconds; where X is configurable', () => {
            const now = Date.now();

            // new primary was generated 1 second ago, secondary should be used
            sandbox.stub(defaultData[0], 'timestamp').value(Math.floor(now / 1000) - 1);

            sandbox.stub(defaultData[1], 'private').value(primaryKey);
            sandbox.stub(cache, 'getData').resolves(defaultData);
            sandbox.useFakeTimers(now);

            const claims = { };
            const expiresIn = 1000;
            const issuer = new JWTIssuer(cache, { iss: serviceId, newCertDelay: 100 });
            return issuer.generate({ claims, expiresIn, algorithm: JWTIssuer.Algortithms.RS256 })
                .then((actual) => {
                    const decoded = jwt.decode(actual);
                    should(decoded.kid).eql(defaultData[1].kid); // secondary should have been used
                });
        });
    });
});



/*
It MUST include an exp claim which contains the expiration timestamp of the token
It MUST include an iat claim which contains the timestamp of when the token was issued (see below).
It MUST include an iss claim which contains the service Id. Format: sage.service-fabric.service-name[.sub-name]
It MUST include a kid claim which contains the identifier of the certificate used to sign the JWT
It MUST periodically check for new certificates in its secure store (see Certificate Rotation and Configuration)
It MUST delay usage of a new certificate for X seconds; where X is configurable (see )
It MUST use timestamp values which are JSON numeric values representing the number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds. This is equivalent to the IEEE Std 1003.1, 2013 Edition [POSIX.1] definition "Seconds Since the Epoch", in which each day is accounted for by exactly 86400 seconds, other than that non-integer values can be represented.  See RFC 3339 [RFC3339] for details regarding date/times in general and UTC in particular.
It MUST have knowledge of the time a certificate was rotated.
 */