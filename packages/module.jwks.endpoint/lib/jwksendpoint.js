'use strict';

const framework = require('framework');
const JwtKeyCache = require('../../../../common/parameterCache/JwtKeyCache');
const serviceNames = require('../../../../services/names');
const access = require('safe-access');

const { Promise, ApplicationError, ApplicationErrorItem } = framework.common;

const keyType = 'RSA';
const keyUse = 'sig';
const algorithm = 'RS256';

class JwksEndpoint {
  constructor(config, Logger, sssManager) {
    this.className = JwksEndpoint.name;
    this.logger = Logger;

    this.services = {
      encryption: sssManager.getService(serviceNames.encryption)
    };

    this.primaryKeyName = access(config, 'jwtKeys.primary.publicKeyName');
    this.secondaryKeyName = access(config, 'jwtKeys.secondary.publicKeyName');

    this.tokenCache = new JwtKeyCache(Logger);
  }

  onGetJwks(...args) {
    return onGetJwksImpl(this, ...args);
  }
}

const onGetJwksImpl = Promise.method((self, req, res) => {
  const func = `${self.className}.onGetJwksImpl`;
  self.logger.info({ function: func, msg: 'started' });

  return self.tokenCache.getParams()
      .then((params) => {
        const primary = params[self.primaryKeyName];
        const secondary = params[self.secondaryKeyName];

        if (!primary) {
          self.logger.error({ function: func, msg: 'primary key not found', keyName: self.primaryKeyName });
          throw new ApplicationError([ApplicationErrorItem.createWithCode('InternalServerError', 'Failed to retrieve key')], 500);
        }
        if (!secondary) {
          self.logger.error({ function: func, msg: 'secondary key not found', keyName: self.secondaryKeyName });
          throw new ApplicationError([ApplicationErrorItem.createWithCode('InternalServerError', 'Failed to retrieve key')], 500);
        }

        return { primary, secondary };
      })
      .then((keys) => {
        const primaryDer = self.services.encryption.convertPemToDer(keys.primary);
        const secondaryDer = self.services.encryption.convertPemToDer(keys.secondary);

        const primaryKeyId = self.services.encryption.getHash(primaryDer);
        const secondaryKeyId = self.services.encryption.getHash(secondaryDer);

        // "x5c" is the DER of the key, "kid" is a hash of this
        const response = { keys: [
            {
              kty: keyType,
              alg: algorithm,
              use: keyUse,
              kid: primaryKeyId,
              x5c: [primaryDer]
            },
            {
              kty: keyType,
              alg: algorithm,
              use: keyUse,
              kid: secondaryKeyId,
              x5c: [secondaryDer]
            }
          ] };

        self.logger.info({ function: func, msg: 'ended' });
        return res.send(200, response);
      });
});

module.exports = JwksEndpoint;
