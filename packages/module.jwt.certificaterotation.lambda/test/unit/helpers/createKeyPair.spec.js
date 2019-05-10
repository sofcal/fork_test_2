const createKeyPair = require('../../../lib/helpers/createKeyPair');
const keyPairWrapper = require('../../../lib/helpers/keyPairWrapper');

const { logger: loggerGen } = require('@sage/bc-debug-utils');

const should = require('should');
const sinon = require('sinon');

describe('@sage/sfab-s2s-jwt-certificaterotation-lambda.helpers.createKeyPair', function() {
    this.timeout(5000);
    const logger = loggerGen(true);

    const sandbox = sinon.createSandbox();

    const regex = {
        public: /-----BEGIN RSA PUBLIC KEY-----\n(?:.{72}\n){5}-----END RSA PUBLIC KEY-----\n/,
        private: /-----BEGIN RSA PRIVATE KEY-----\n(?:.{72}\n){22}(?:.{1,72}\n)-----END RSA PRIVATE KEY-----\n/
    };

    afterEach(() => {
        sandbox.restore();
    });

    it('should generate a keypair', () => {
        should(createKeyPair({ logger })).match(regex);
    });

    it('should throw if the generator throws', () => {
        const expected = new Error('generator_error');
        sandbox.stub(keyPairWrapper, 'keypair').throws(expected);
        should(
            () => createKeyPair({ logger })
        ).throwError(new Error('Failed to create new primary keys'));
    });
});