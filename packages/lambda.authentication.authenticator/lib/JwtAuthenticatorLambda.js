const validate = require('./validators');
const ErrorSpecs = require('./ErrorSpecs');

const { Handler } = require('@sage/bc-independent-lambda-handler');
const { RequestLogger } = require('@sage/bc-request-logger');
const { Authenticate } = require('@sage/bc-jwt-authenticator');
const { EndPointsStore } = require('@sage/bc-endpoints-store');
const { StatusCodeError } = require('@sage/bc-status-code-error');

const Promise = require('bluebird');

class JwtAuthenticatorLambda extends Handler {
    constructor() {
        super({ config: process.env });

        this.cache = null;
        this.issuer = null;
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

                // temp hardcoded
                const serviceMappings = [];
                const jwksDelay = 300;

                const cachingService = new EndPointsStore(serviceMappings, jwksDelay);
                const validIssuers = serviceMappings.map((s) => s.iss);
                const auth = new Authenticate(event.authToken, validIssuers, cachingService, event.logger);

                return auth.validate()
                    .then(() => event.logger.info({ function: func, log: 'cert structure validated' }))
                    .then(() => auth.getCertList())
                    .then(() => auth.checkAuthorisation())
                    .then(() => ({ response: 'OK' }))
                    .catch((err) => {
                        throw StatusCodeError.CreateFromSpecs([ErrorSpecs[err]], ErrorSpecs[err].statusCode);
                    });
            });
    }
}

module.exports = JwtAuthenticatorLambda;