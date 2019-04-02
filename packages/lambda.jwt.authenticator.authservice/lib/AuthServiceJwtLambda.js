/* eslint-disable class-methods-use-this */

const { JwtAuthenticatorLambda } = require('@sage/sfab-s2s-jwt-authenticator-lambda');

const paramStore = require('./paramStore.js');
const jwtGenerator = require('./requestJwtGenerator.js');

const SERVICE_NAME = 'gateway';
const PARAMETER_PATH = `/${process.env.ENVIRONMENT}/${SERVICE_NAME}/`;
// After a key rotation, we might need to try with this one
// And we'll use this private key for signing the JWT token that we'll use to call the internal microservices.
const GATEWAY_PRIVATE_KEY_PARAM = `${PARAMETER_PATH}private-key`;

const PARAMS_TO_RETRIEVE = [GATEWAY_PRIVATE_KEY_PARAM];

class AuthServiceJwtLambda extends JwtAuthenticatorLambda {
    constructor(config) {
        super(config);
    }

    static Create(...args) {
        return new JwtAuthenticatorLambda(...args);
    }

    buildResponse(data, { logger }) {
        const func = `${JwtAuthenticatorLambda.name}.buildResponse`;
        logger.info({ function: func, log: 'started' });
        return paramStore.getParameters(PARAMS_TO_RETRIEVE)
            .then((params) => {
                return jwtGenerator.generateRequestToken(params[GATEWAY_PRIVATE_KEY_PARAM], SERVICE_NAME);
            })
            .then((overrideToken) => {
                const updated = Object.assign({}, data, { token: overrideToken });
                logger.info({ function: func, log: 'calling super to finish building response' });
                return super.buildResponse(updated, { logger });
            })
            .then((ret) => {
                logger.info({ function: func, log: 'started' });
                return ret;
            });
    }
}

module.exports = AuthServiceJwtLambda;
