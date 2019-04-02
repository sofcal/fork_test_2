/* eslint-disable class-methods-use-this */

const validate = require('./validators');

const { Handler } = require('@sage/bc-independent-lambda-handler');
const { JwtAuthenticator } = require('@sage/sfab-s2s-jwt-authenticator');
const { EndpointsStore } = require('@sage/sfab-s2s-jwt-endpoint-store');

const Promise = require('bluebird');

const FORWARDED_IP_HEADER = 'x-forwarded-for';

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
                        event.logger.info({ function: func, log: 'ended' });
                        return { result, headers: event.headers, token };
                    });
            });
    }

    buildResponse({ result: { claims }, headers = {}, token }, { logger }) {
        const func = `${JwtAuthenticatorLambda.name}.buildResponse`;
        return Promise.resolve(undefined)
            .then(() => {
                logger.info({ function: func, log: 'started' });
                Object.assign(claims, { xForwardedFor: headers[FORWARDED_IP_HEADER] }, { token });
                const policy = generatePolicy('Allow', '*', claims);
                logger.info({ function: func, log: 'ended' });

                return [null, policy];
            });
    }

    buildErrorResponse(err, { logger }) {
        const func = `${JwtAuthenticatorLambda.name}.buildErrorResponse`;
        logger.info({ function: func, log: 'started' });
        logger.info({ function: func, log: 'ended' });
        return Promise.resolve(['Unauthorized']);
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
