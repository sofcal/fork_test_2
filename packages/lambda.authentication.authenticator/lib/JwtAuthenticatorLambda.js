/* eslint-disable class-methods-use-this */

const validate = require('./validators');
const ErrorSpecs = require('./ErrorSpecs');

const { Handler } = require('@sage/bc-independent-lambda-handler');
const { Authenticate } = require('@sage/bc-jwt-authenticator');
const { EndpointsStore } = require('@sage/bc-endpoints-store');
const { Cache } = require('@sage/bc-data-cache');
const { StatusCodeError } = require('@sage/bc-status-code-error');

const Promise = require('bluebird');

class JwtAuthenticatorLambda extends Handler {
    constructor() {
        super({ config: process.env });

        this.cache = null;
    }

    validate(event, { logger }) {
        // do any additional validation on the environment variables (this.config) or event here
        validate.event(event);

        return super.validate(event, { logger });
    }

    init(event, { logger }) {
        return Promise.resolve(undefined)
            .then(() => {
                const func = 'JwtIssuerLambda.impl';
                // one time instantiation - we'll re-use these
                logger.info({ function: func, log: 'started' });

                // ****** temp hardcoded
                const serviceMappings = {
                    'sage.authentication.test': 'https://gmade6j328.execute-api.eu-west-1.amazonaws.com/test/service1/jwks'
                };
                const cacheExpiry = 300;
                // *********************

                logger.info({ function: func, log: 'creating store service' });
                const storeService = new EndpointsStore({
                    endpointMappings: serviceMappings,
                    cacheExpiry,
                    cacheClass: Cache,
                }, logger);
                const validIssuers = Object.keys(serviceMappings);

                logger.info({ function: func, log: 'creating auth service' });
                this.auth = new Authenticate({
                    validIssuers,
                    storeService,
                }, logger);

                logger.info({ function: func, log: 'ended' });
            });
    }

    impl(event) {
        return Promise.resolve(undefined)
            .then(() => {
                const func = 'JwtIssuerLambda.impl';
                event.logger.info({ function: func, log: 'started' });

                // extract auth token from event
                const [, token] = event.authorizationToken.split(' ');

                return this.auth.checkAuthorisation(token)
                    .then((res) => {
                        event.logger.info({ function: func, log: 'ended' });
                        return res;
                    })
                    .catch((err) => {
                        const code = !ErrorSpecs[err.message] ? 'unknownError' : err.message;
                        throw StatusCodeError.CreateFromSpecs([ErrorSpecs[code]], ErrorSpecs[code].statusCode);
                    });
            });
    }

    buildResponse({ claims }, { logger }) {
        const func = `${JwtAuthenticatorLambda.name}.buildResponse`;

        logger.info({ function: func, log: 'started' });
        const policy = generatePolicy('Allow', '*', claims);
        logger.info({ function: func, log: 'ended' });

        return policy;
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
