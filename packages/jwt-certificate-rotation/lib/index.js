const validate = require('./validators');
const Promise = require('bluebird');

const { Handler } = require('internal-handler');

const ParameterService = require('internal-parameter-service');
const keys = require('./params');
const createKeyPair = require('keypair');

class Jwt extends Handler {
    constructor() {
        super({
            dbName: 'bank_db',
            keys
        });
    }

    impl(event, params, services) {
        return Promise.resolve(undefined).then(() => {
            this.func = 'impl.run';
            event.logger.info({ function: this.func, log: 'started' });

            validate.event(event);
            const keyPair = createKeyPair();
            const { Environment: env = 'test' } = process.env;
            const paramPrefix = `/${env}/`;

            const keyPairParams = [{
                Name: `${paramPrefix}jwt.publicKey`,
                Type: 'SecureString',
                Value: keyPair.public,
                KeyId: 'alias/test/rotation'
            }, {
                Name: `${paramPrefix}jwt.secret`,
                Type: 'SecureString',
                Value: keyPair.private,
                KeyId: 'alias/test/rotation'
            }];

            return Promise.each(keyPairParams, // eslint-disable-line function-paren-newline
                (p) => {
                    return services.parameter.setParameter({ name: p.Name, value: p.Value, type: p.Type, keyId: p.KeyId })
                        .then(() => {
                            event.logger.info({ function: this.func, log: 'successfully added new key', key: p.Name });
                        });
                }) // eslint-disable-line function-paren-newline
                .then(() => ({ '/test/testPrivateKey': keyPair.private, '/test/testPublicKey': keyPair.public }));
        });
    }

    loadAdditionalServices({ env, region, params }) {
        const paramPrefix = `/${env}/`;

        this.services.parameter = ParameterService.Create({ env: { region }, paramPrefix });
    }
}

module.exports.run = (event, context, callback) => {
    return new Jwt().run(event, context, callback);
};

// module.exports = new Jwt();
