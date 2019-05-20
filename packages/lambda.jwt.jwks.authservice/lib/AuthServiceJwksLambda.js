'use strict';

const { JwksLambda } = require('@sage/sfab-s2s-jwt-jwks-lambda');
const { Jwks } = require('@sage/sfab-s2s-jwt-jwks');

class AuthServiceJwksLambda extends JwksLambda {
    constructor(config) {
        super(config);

        this.cache = null;
    }

    static Create(...args) {
        return new AuthServiceJwksLambda(...args);
    }

    cacheRefresh({ logger }) {
        const func = `${AuthServiceJwksLambda.name}.cacheRefresh`;
        logger.info({ function: func, log: 'started' });

        const params = ['wpb-auth/public-key', 'wpb-auth/public-key-last'];
        const defaultCreatedAt = Math.floor(Date.now() / 1000);
        const keyNameEnums = [{
            keyToUseForKid: 'wpb-auth/public-key',
            publicKey: 'wpb-auth/public-key'
        },
        {
            keyToUseForKid: 'wpb-auth/public-key-last',
            publicKey: 'wpb-auth/public-key-last'
        }];

        return this.services.parameter.getParameters(params)
            .then((data) => {
                // for each keyNameEnum object (which contains the keyIds for our param-store values), check all the properties
                // are valid, and generate a JWKS
                const mapped = keyNameEnums
                    .filter((k) => Jwks.isValid(data[k.publicKey], data[k.keyToUseForKid], defaultCreatedAt, parseInt(this.config.certExpiry, 10)))
                    .map((k) => {
                        const keyToUseForKeyId = AuthServiceJwksLambda.adjustToMatchAuthService(data[k.keyToUseForKid], this.config.USEOLDFORMAT);
                        return Jwks.Generate(data[k.publicKey], keyToUseForKeyId, true);
                    });

                logger.info({ function: func, log: 'ended' });
                return mapped;
            });
    }

    static adjustToMatchAuthService(key, useOldFormat) {
        const der = Jwks.ConvertPemToX5C(key);

        if (!useOldFormat) {
            return der;
        }

        return der.replace(/(.{64})/g, '$1\r');
    }
}

module.exports = AuthServiceJwksLambda;
