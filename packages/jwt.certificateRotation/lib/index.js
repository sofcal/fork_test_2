/* eslint-disable no-console,prefer-template */
const validate = require('./validators');
const Promise = require('bluebird');

const { Handler } = require('internal-handler');
const ParameterService = require('internal-parameter-service');
const { RequestLogger } = require('internal-request-logger');

const keys = require('./params');
const keyPair = require('./keyPair');

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
                this.func = 'Jwt.impl';
                event.logger.info({ function: this.func, log: 'started' });
                validate.process(process);

                const { Environment: env } = process.env;
                this.paramPrefix = `/${env}/`;

                const primaryKeyNames = [
                    `${this.paramPrefix}accessToken.primary.publicKey`,
                    `${this.paramPrefix}accessToken.primary.privateKey`
                ];

                return Promise.map(primaryKeyNames, (key) => {
                    // get current primary key values (public and private)
                    return services.parameter.getParameters([key])
                        .catch((err) => {
                            console.log('alert: ' + err);
                            throw new Error('Error thrown by getParameters.');
                        })
                        .then((response) => {
                            // on first run, primary keys won't exist.
                            if (!response[key]) {
                                this.createKeyPair()
                                    .then((newKeyPair) => {
                                        this.saveKeyPairToParams(newKeyPair, true);
                                        throw new Error('Primary keys did not exist, created new primary and secondary keys');
                                    });
                            }
                            // key found, return new SSM object for secondary key
                            return {
                                name: key.replace(/primary/, 'secondary'),
                                type: 'SecureString',
                                value: response[key],
                                overwrite: true
                            };
                        })
                        .catch((err) => {
                            throw err;
                        });
                })
                    .then((secondaryKeyArray) => {
                        return this.setParams(secondaryKeyArray)
                            .catch((err) => {
                                console.log('alert: ' + err);
                                throw new Error('Failed to copy primary key values to secondary key');
                            });
                    })
                    .then(() => this.createKeyPair())
                    .then((newKeyPair) => this.saveKeyPairToParams(newKeyPair));
            });
    }

    createKeyPair() { //eslint-disable-line
        return keyPair.createKeyPair()
            .then((kp) => kp)
            .catch((err) => {
                console.log('alert: ' + err);
                throw new Error('Failed to create new primary keys');
            });
    }

    saveKeyPairToParams(keypair, copyToSecondary) {
        const newParams = [{
            name: `${this.paramPrefix}accessToken.primary.publicKey`,
            type: 'SecureString',
            value: keypair.public,
            overwrite: true
        }, {
            name: `${this.paramPrefix}accessToken.primary.privateKey`,
            type: 'SecureString',
            value: keypair.private,
            overwrite: true
        }];
        if (copyToSecondary) {
            newParams.push({
                name: `${this.paramPrefix}accessToken.secondary.publicKey`,
                type: 'SecureString',
                value: keypair.public,
                overwrite: true
            }, {
                name: `${this.paramPrefix}accessToken.secondary.privateKey`,
                type: 'SecureString',
                value: keypair.private,
                overwrite: true
            });
        }
        return this.setParams(newParams)
            .then((response) => response)
            .catch((err) => {
                console.log('alert: ' + err);
                throw new Error('Failed to save new keys');
            });
    }

    loadAdditionalServices({ env, region }) {
        const paramPrefix = `/${env}/`;
        this.services.parameter = ParameterService.Create({ env: { region }, paramPrefix });
    }

    setParams(params) {
        return Promise.each(params, ({ name, value, type, overwrite }) => {
            return this.services.parameter.setParameter({ name, value, type, overwrite });
        });
    }
}

module.exports.run = (event, context, callback) => {
    // eslint-disable-next-line no-param-reassign
    event.logger = RequestLogger.Create({ service: 'jwt-certificate-rotation' });
    return new Jwt().run(event, context, callback);
};
