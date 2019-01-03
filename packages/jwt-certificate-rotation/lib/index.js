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
        return Promise.resolve(undefined)
            .then(() => {
                this.func = 'impl.run';
                event.logger.info({ function: this.func, log: 'started' });
                validate.event(event);

                const { Environment: env = 'test' } = process.env;
                const paramPrefix = `/${env}/`;

                // TODO copy primary keys to secondary before attempting to create and push primary keys.
                const primaryKeyNames = [
                    `${paramPrefix}accessToken.primary.publicKey`,
                    `${paramPrefix}accessToken.primary.privateKey`
                ];

                return Promise.all(primaryKeyNames, (key) => {
                    // get current primary key values (public and private)
                    return services.parameter.getParameters(key)
                        .then((response) => {
                            // on first run, primary keys won't exist.
                            if (!response[key]) {
                                return undefined;
                            }
                            // key found, return new SSM object for secondary key
                            return {
                                Name: key.replace(/primary/, 'secondary'),
                                Type: 'SecureString',
                                Value: response[key],
                                Overwrite: true
                            };
                        })
                        // for the retrieved primary key, update the secondary key with the same value
                        .then((newSecondaryKey) => {
                            if (!newSecondaryKey) {
                                return undefined;
                            }
                            return this.setParams(newSecondaryKey);
                        })
                        .catch(() => {
                            return Promise.reject(new Error(`Failed to set key '${key}'.`));
                        });
                })
                    .catch(() => {
                        Jwt.throwLambdaError('Failed to copy primary key values to secondary key');
                    })
                    .then(() => {
                        // create new AES key pair and build SSM objects for new primary keys
                        const keyPair = createKeyPair();
                        const newPrimaryKeys = [{
                            Name: `${paramPrefix}accessToken.primary.publicKey`,
                            Type: 'SecureString',
                            Value: keyPair.public,
                            Overwrite: true
                        }, {
                            Name: `${paramPrefix}accessToken.primary.privateKey`,
                            Type: 'SecureString',
                            Value: keyPair.private,
                            Overwrite: true
                        }];
                        return this.setParams(newPrimaryKeys);
                    })
                    .catch(() => {
                        Jwt.throwLambdaError('Failed to create new primary keys');
                    });
            });
    }

    loadAdditionalServices({ env, region, params }) {
        const paramPrefix = `/${env}/`;
        this.services.parameter = ParameterService.Create({ env: { region }, paramPrefix });
    }

    setParams(params) {
        const [event] = this;
        return Promise.all(params, (p) => {
            return this.services.parameter.setParameter({ name: p.Name, value: p.Value, type: p.Type })
                .then(() => {
                    event.logger.info({
                        function: this.func,
                        log: 'added new key',
                        key: p.Name
                    });
                })
                .catch(() => {
                    Promise.reject(new Error(`Failed to set key '${p.Name}'`));
                });
        });
    }

    static throwLambdaError(message) {
        const lambdaError = new Error(message);
        lambdaError.failLambda = true;
        throw lambdaError;
    }
}

module.exports.run = (event, context, callback) => {
    return new Jwt().run(event, context, callback);
};
