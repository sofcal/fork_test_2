/* eslint-disable class-methods-use-this */

const validate = require('./validators');

const { Handler } = require('@sage/bc-independent-lambda-handler');
const { JwtAuthenticator } = require('@sage/sfab-s2s-jwt-authenticator');
const { EndpointsStore } = require('@sage/sfab-s2s-jwt-endpoint-store');

const paramStore = require('./paramStore.js');
const jwtGenerator = require('./requestJwtGenerator.js');

const Promise = require('bluebird');

const Bearer = 'Bearer ';

const SERVICE_NAME = 'gateway';
const PARAMETER_PATH = '/' + process.env.ENVIRONMENT + '/' + SERVICE_NAME + '/';
// We'll use this public key for validating the signature on the incoming JWT/JWE
// (it comes in as a JWE token, but then it's a JWT once we've decrypted it).
const AUTH_PUBLIC_KEY_PARAM = '/' + process.env.ENVIRONMENT + '/wpb-auth/public-key';
// After a key rotation, we might need to try with this one
const LAST_AUTH_PUBLIC_KEY_PARAM = '/' + process.env.ENVIRONMENT + '/wpb-auth/public-key-last';
// And we'll use this private key for signing the JWT token that we'll use to call the internal microservices.
const GATEWAY_PRIVATE_KEY_PARAM = PARAMETER_PATH + 'private-key';
// And these ones are just something we use for checking the incoming application header
const DESKTOP_APPLICATION_NAMES_PARAM = PARAMETER_PATH + 'authorised-applications';
const ONLINE_APPLICATION_NAMES_PARAM = PARAMETER_PATH + 'authorised-online-applications';
const FORWARDED_IP_HEADER = 'x-forwarded-for';
const PARAMS_TO_RETRIEVE = [DESKTOP_APPLICATION_NAMES_PARAM, GATEWAY_PRIVATE_KEY_PARAM, AUTH_PUBLIC_KEY_PARAM, ONLINE_APPLICATION_NAMES_PARAM];

class JwtAuthenticatorLambda extends Handler {
    constructor(config) {
        super(config);

        this.cache = null;
    }

    static Create(...args) {
        return new JwtAuthenticatorLambda(...args);
    }

    validate(event, debug) {
        // do any additional validation on the environment variables (this.config) or event here
        validate.config(this.config, debug);
        validate.event(event, debug);

        return super.validate(event, debug);
    }

    init(event, { logger }) {
        return Promise.resolve(undefined)
            .then(() => {
                const func = `${JwtAuthenticatorLambda.name}.init`;
                // one time instantiation - we'll re-use these
                logger.info({ function: func, log: 'started' });

                const { cacheExpiry, refreshDelay, serviceMappings } = this.config;
                const endpointMappings = JSON.parse(serviceMappings || '{}');

                logger.info({ function: func, log: 'creating store service' });
                const storeService = EndpointsStore.Create({ endpointMappings, cacheExpiry: parseInt(cacheExpiry, 10), refreshDelay: parseInt(refreshDelay, 10) }, { logger });
                const validIssuers = Object.keys(endpointMappings);

                logger.info({ function: func, log: 'creating auth service' });
                this.auth = JwtAuthenticator.Create({ validIssuers, storeService, }, { logger });

                logger.info({ function: func, log: 'ended' });
                return true;
            });
    }

    impl(event) {
        return Promise.resolve(undefined)
            .then(() => {
                const func = `${JwtAuthenticatorLambda.name}.impl`;
                event.logger.info({ function: func, log: 'started' });

                // extract auth token from event
                const auth = event.authorizationToken || event.headers.Authorization;
                const [, token] = auth.split(' ');

                return this.auth.checkAuthorisation(token)
                    .then((result) => {
                        event.logger.info({ function: func, log: 'validated token' });

                        return paramStore.getParameters(PARAMS_TO_RETRIEVE)
                            .then((params) => {
                                return jwtGenerator.generateRequestToken(params[GATEWAY_PRIVATE_KEY_PARAM], SERVICE_NAME)
                                    .then((generated) => {
                                        event.logger.info({ function: func, log: 'ended' });
                                        return { result, headers: event.headers, token: generated };
                                    });
                            });
                    });
            });
    }

    buildResponse({ result: { claims }, headers = {}, token }, { logger }) {
        const func = `${JwtAuthenticatorLambda.name}.buildResponse`;

        logger.info({ function: func, log: 'started' });
        Object.assign(claims, { xForwardedFor: headers[FORWARDED_IP_HEADER] }, { token });
        const policy = generatePolicy('Allow', '*', claims);
        logger.info({ function: func, log: 'ended' });

        return [null, policy];
    }

    buildErrorResponse() {
        return ['Unauthorized'];
    }
}

const generatePolicy = (effect, resource, context) => {
    const authResponse = {};

    if (effect && resource) {
        const policyDocument = {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        const statementOne = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    // Optional output with custom properties of the String, Number or Boolean type.
    authResponse.context = context;
    return authResponse;
};

module.exports = JwtAuthenticatorLambda;
