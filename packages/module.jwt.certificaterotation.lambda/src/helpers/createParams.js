'use strict';

const resources = require('../resources');

module.exports = (primaryKeyPair, secondaryKeyPair, { logger }) => {
    const func = 'createParams';

    const hasPrimaryKeyPair = !!(primaryKeyPair && primaryKeyPair.private && primaryKeyPair.public);
    const hasSecondaryKeyPair = !!(secondaryKeyPair && secondaryKeyPair.private && secondaryKeyPair.public);
    logger.info({ function: func, log: 'creating parameter store values', params: { hasPrimaryKeyPair, hasSecondaryKeyPair } });

    if (!hasPrimaryKeyPair) {
        logger.error({ function: func, log: 'invalid primary key pair', params: { hasPrimaryKeyPair, hasSecondaryKeyPair } });
        throw new Error('invalid primary key pair');
    }

    const ret = {};

    logger.info({ function: func, log: 'creating primary values', params: { hasPrimaryKeyPair, hasSecondaryKeyPair } });
    ret.primary = [
        param(resources.keyNames.primary.public, primaryKeyPair.public),
        param(resources.keyNames.primary.private, primaryKeyPair.private),
        param(resources.keyNames.primary.createdAt, primaryKeyPair.createdAt)
    ];

    const toUseAsSecondary = hasSecondaryKeyPair ? secondaryKeyPair : primaryKeyPair;

    logger.info({ function: func, log: 'creating secondary values', params: { hasPrimaryKeyPair, hasSecondaryKeyPair } });
    ret.secondary = [
        param(resources.keyNames.secondary.public, toUseAsSecondary.public),
        param(resources.keyNames.secondary.private, toUseAsSecondary.private),
        param(resources.keyNames.secondary.createdAt, toUseAsSecondary.createdAt)
    ];

    logger.info({ function: func, log: 'returning parameter store values', params: { hasPrimaryKeyPair, hasSecondaryKeyPair } });
    return ret;
};

const param = (name, value) => ({ name, type: resources.keyTypes.secureString, value, overwrite: true });
