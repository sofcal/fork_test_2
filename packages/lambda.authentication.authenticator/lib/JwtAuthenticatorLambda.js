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
                    temp: 'https://gmade6j328.execute-api.eu-west-1.amazonaws.com/test/service1/jwks'
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
                        throw StatusCodeError.CreateFromSpecs([ErrorSpecs[err]], ErrorSpecs[err].statusCode);
                    });
            });
    }
}

module.exports = JwtAuthenticatorLambda;
