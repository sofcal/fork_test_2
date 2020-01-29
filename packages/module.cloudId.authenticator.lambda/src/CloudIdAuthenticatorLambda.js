/* eslint-disable class-methods-use-this */

const validate = require('./validators');

const { Handler } = require('@sage/bc-independent-lambda-handler');
const { CloudIdAuthenticator } = require('@sage/sfab-s2s-cloudid-authenticator');
const generatePrincipalId = require('./helpers/generatePrincipalId');

const Promise = require('bluebird');
const jwksRsa = require('jwks-rsa');

const FORWARDED_IP_HEADER = 'x-forwarded-for';

class CloudIdAuthenticatorLambda extends Handler {
    constructor(config) {
        super(config);
    }

    static Create(...args) {
        return new CloudIdAuthenticatorLambda(...args);
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
                const func = `${CloudIdAuthenticatorLambda.name}.init`;
                // one time instantiation - we'll re-use these
                logger.info({ function: func, log: 'started' });

                const { validClients, validIssuer, validAudiences, jwksCache, jwksRateLimit, validScopes, jwksRequestsPerMinute } = this.config;

                const jwksClient = jwksRsa({
                    cache: jwksCache || true,
                    rateLimit: jwksRateLimit || true,
                    jwksRequestsPerMinute: jwksRequestsPerMinute || 10,
                    strictSsl: true,
                    jwksUri: `${validIssuer}.well-known/jwks.json`
                });

                logger.info({ function: func, log: 'creating auth service' });
                this.auth = CloudIdAuthenticator.Create({ validIssuer, validAudiences, validClients, validScopes }, jwksClient, { logger });

                logger.info({ function: func, log: 'ended' });
                return true;
            });
    }

    impl(event) {
        return Promise.resolve(undefined)
            .then(() => {
                const func = `${CloudIdAuthenticatorLambda.name}.impl`;
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
        const func = `${CloudIdAuthenticatorLambda.name}.buildResponse`;
        return Promise.resolve(undefined)
            .then(() => {
                logger.info({ function: func, log: 'started' });
                Object.assign(claims, { xForwardedFor: headers[FORWARDED_IP_HEADER] }, { token });
                const principalId = generatePrincipalId(this.config.principalIdTemplate, claims, claims.azp);
                const policy = generatePolicy('Allow', '*', claims, principalId);
                logger.info({ function: func, log: 'ended' });

                return [null, policy];
            });
    }

    buildErrorResponse(err, { logger }) {
        const func = `${CloudIdAuthenticatorLambda.name}.buildErrorResponse`;
        logger.info({ function: func, log: 'started' });
        logger.info({ function: func, log: 'ended' });
        return Promise.resolve(['Unauthorized']);
    }
}

const generatePolicy = (effect, resource, context, principalId) => {
    const authResponse = {};

    if (effect && resource) {
        const policyDocument = {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        const statementOne = {};
        statementOne.Action = '*';
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    // Optional output with custom properties of the String, Number or Boolean type.
    authResponse.context = context;

    if (principalId) {
        authResponse.principalId = principalId;
    }

    return authResponse;
};

module.exports = CloudIdAuthenticatorLambda;
