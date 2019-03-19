const validate = require('./validators');
const ErrorSpecs = require('./ErrorSpecs');

const { Handler } = require('@sage/bc-independent-lambda-handler');
const temp = require('@sage/bc-jwt-authenticator');
const { Authenticate, utils: { refreshFn, mappingFn } } = require('@sage/bc-jwt-authenticator');
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

                logger.info({ function: func, log: 'ended' });
            });
    }

    impl(event) {
        return Promise.resolve(undefined)
            .then(() => {
                const func = 'JwtIssuerLambda.impl';
                event.logger.info({ function: func, log: 'started' });

                // ****** temp hardcoded
                const serviceMappings = [];
                const cacheExpiry = 300;

                const storeService = new EndpointsStore({
                    endpointMappings: serviceMappings,
                    cacheExpiry,
                    logger: event.logger,
                    cacheClass: Cache,
                    refreshFunction: refreshFn,
                    mappingFunction: mappingFn,
                });
                const validIssuers = serviceMappings.map((s) => s.iss);

                const auth = new Authenticate({
                    authToken: event.authToken,
                    validIssuers,
                    storeService,
                    logger: event.logger,
                });

                return auth.getCertList()
                    .then(() => auth.checkAuthorisation())
                    .then((res) => {
                        event.logger.info({ function: func, log: 'ended' });
                        return res;
                    })
                    .catch((err) => {
                        throw StatusCodeError.CreateFromSpecs([ErrorSpecs[err]], ErrorSpecs[err].statusCode)
                    });
            });
    }
}

module.exports = JwtAuthenticatorLambda;