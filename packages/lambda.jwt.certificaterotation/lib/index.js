/* eslint-disable no-console,prefer-template */
const validate = require('./validators');
const Promise = require('bluebird');

const {Handler} = require('@sage/bc-default-lambda-handler');
const {RequestLogger} = require('@sage/bc-requestlogger');

const keys = require('./params');
const keyPair = require('./keyPair');

class Jwt extends Handler {
    constructor(parameterStore) {
        super({
            dbName: 'bank_db',
            keys
        });
        this.func = 'Jwt.impl';
        this.services.parameter = parameterStore;
    }

    impl(event, params, services) {
        const self = this;
        return Promise.resolve(undefined)
            .then(() => {
                event.logger.info({function: self.func, log: 'started'});
                validate.process(process);

                const {Environment: env} = process.env;
                this.paramPrefix = `/${env}/`;

                const primaryKeyNames = [
                    `${this.paramPrefix}accessToken.primary.publicKey`,
                    `${this.paramPrefix}accessToken.primary.privateKey`,
                    `${this.paramPrefix}accessToken.primary.createdAt`
                ];
                return Promise.map(primaryKeyNames, (key) => {
                    // get current primary key values (public and private)

                    return this.services.parameter.getParameters([key])
                        .catch((err) => {
                            event.logger.error({
                                function: self.func,
                                log: `services.parameter.getParameters(${key})`,
                                err: err
                            });
                            throw new Error('Error thrown by getParameters.');
                        })
                        .then((response) => {
                            // on first run, primary keys won't exist.
                            if (!response[key]) {
                                throw new Error('Primary keys did not exist, creating new primary and secondary keys');
                            }
                            // key found, return new SSM object for secondary key
                            return {
                                name: key.replace(/primary/, 'secondary'),
                                type: 'SecureString',
                                value: response[key],
                                overwrite: true
                            };
                        });
                })
                    .catch((err) => { // accounts for initial run where primary key doesn't exist and above .map() fails
                        if (err.message === 'Primary keys did not exist, creating new primary and secondary keys') {
                            event.logger.info({
                                function: self.func,
                                log: 'no primary keys, creating new primary and secondary keys'
                            });
                            this.createKeyPair(event)
                                .then((newKeyPair) => {
                                    this.saveKeyPairToParams(event, newKeyPair, true);
                                });
                        }
                        throw err;
                    })
                    .then((secondaryKeyArray) => {
                        return this.setParams(secondaryKeyArray)
                            .catch((err) => {
                                event.logger.error({
                                    function: self.func,
                                    log: `setParams(${secondaryKeyArray})`,
                                    err: err
                                });
                                throw new Error('Failed to copy primary key values to secondary key');
                            });
                    })
                    .then(() => {
                        event.logger.info({function: this.func, log: 'creating key pair'});
                        return this.createKeyPair(event);
                    })
                    .then((newKeyPair) => {
                        event.logger.info({function: this.func, log: 'creating key pair'});
                        return this.saveKeyPairToParams(event, newKeyPair);
                    })
                    .finally(() => {
                        event.logger.info({function: self.func, log: 'ended'});
                    });
            });
    }

    createKeyPair(event) { //eslint-disable-line
        const func = 'createKeyPair';
        return keyPair.createKeyPair() // defaults to 2048, shorter keys cause problems due to length of digest
            .then((kp) => {
                event.logger.info({function: func, log: 'returning new key pair'});
                return kp;
            })
            .catch((err) => {
                event.logger.error({
                    function: func,
                    log: `createKeyPair`,
                    err: err
                });
                throw new Error('Failed to create new primary keys');
            });
    }

    saveKeyPairToParams(event, keypair, copyToSecondary) {
        const func = 'saveKeyPairToParams';
        event.logger.info({ function: func, log: 'saving keys to param store', copyToSecondary });
        const createdAt = Math.floor(new Date().getTime() / 1000);
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
        }, {
            name: `${this.paramPrefix}accessToken.primary.createdAt`,
            type: 'SecureString',
            value: createdAt,
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
            }, {
                name: `${this.paramPrefix}accessToken.secondary.createdAt`,
                type: 'SecureString',
                value: createdAt,
                overwrite: true
            });
        }
        return this.setParams(newParams)
            .then((response) => {
                event.logger.info({function: this.func, log: 'saved keys to param store', copyToSecondary});
                return response;
            })
            .catch((err) => {
                event.logger.error({function: this.func, log: `Failed to save new keys:`, err: err});
                throw new Error('Failed to save new keys');
            });
    }

    loadAdditionalServices({env, region}) { // TODO: It should be here (because of the parent), but it should be empty
        // const paramPrefix = `/${env}/`;
        // this.services.parameter = ParameterService.Create({env: {region}, paramPrefix});
    }

    setParams(params) {
        return Promise.each(params, ({name, value, type, overwrite}) => {
            return this.services.parameter.setParameter({name, value, type, overwrite});
        });
    }
}

/**
 *
 * @param event {AWS_REGION: region, env}
 * @param context {context: ..., logGroupName: ... , parameterstore: ...}
 * @param callback AWS callback ?
 * @returns {*}
 */
module.exports.run = (event, context, callback) => {
    // eslint-disable-next-line no-param-reassign
    event.logger = RequestLogger.Create({service: 'jwt-certificate-rotation'});
    return new Jwt(context.parameterstore).run(event, context, callback);
};