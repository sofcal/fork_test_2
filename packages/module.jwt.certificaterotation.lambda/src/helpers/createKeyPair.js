'use strict';

const keyPairWrapper = require('./keyPairWrapper');

module.exports = ({ logger }) => {
    const func = 'createKeyPair';
    try {
        const keyPair = keyPairWrapper.keypair(); // defaults to 2048, shorter keys cause problems due to length of digest
        keyPair.createdAt = Math.floor(new Date().getTime() / 1000);

        logger.info({ function: func, log: 'returning new key pair' });
        return keyPair;
    } catch (err) {
        logger.error({ function: func, log: 'failed to create key pair', err: err.message || err });
        throw new Error('Failed to create new primary keys');
    }
};
