'use strict';

const Promise = require('bluebird');
const validate = require('./validators');
const createKeyPair = require('keypair');

class Impl {
    static run(event, params, services) {
        return Promise.resolve(undefined).then(() => {
            const func = 'impl.run';
            event.logger.info({ function: func, log: 'started' });

            validate.event(event);

            const keyPair = createKeyPair();

            const keyPairParams = [{
                Name: '/test/testPublicKey',
                Type: 'SecureString',
                Value: keyPair.public,
                KeyId: 'alias/test/rotation'
            }, {
                Name: '/test/testPrivateKey',
                Type: 'SecureString',
                Value: keyPair.private,
                KeyId: 'alias/test/rotation'
            }];

            return Promise.each(keyPairParams, // eslint-disable-line function-paren-newline
                (p) => {
                    return services.parameter.setParameter({ name: p.Name, value: p.Value, type: p.Type, keyId: p.KeyId })
                        .then(() => {
                            event.logger.info({ function: func, log: 'successfully added new key', key: p.Name });
                        });
                }) // eslint-disable-line function-paren-newline
                .then(() => ({ '/test/testPrivateKey': keyPair.private, '/test/testPublicKey': keyPair.public }));
        });
    }
}

module.exports.run = Impl.run;
