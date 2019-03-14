/* eslint-disable no-console,prefer-template */
const validate = require('./validators');
const Promise = require('bluebird');

const { Handler } = require('@sage/bc-default-lambda-handler');
const ParameterService = require('@sage/bc-parameterstore-static-loader');
const { RequestLogger } = require('@sage/bc-request-logger');
const { Authenticate } = require('@sage/bc-jwt-authenticator');
const { EndPointsStore } = require('@sage/bc-endpoints-store');
const { ErrorSpecs } = require('@sage/bc-default-lambda-handler');
const { StatusCodeError } = require('@sage/bc-status-code-error');

const keys = require('./params');

class JwtAuth extends Handler {
    constructor() {
        super({
            dbName: 'bank_db',
            keys
        });
        this.func = 'JwtAuth.impl';
    }

    impl(event, params, services) {
        const self = this;
        return Promise.resolve()
            .then(() => {
                event.logger.info({ function: self.func, log: 'started' });
                validate.process(process);

                const { Environment: env } = process.env;
                this.paramPrefix = `/${env}/`;

                // temp hardcoded
                const serviceMappings = [];
                const jwksDelay = 300;

                const cachingService = new EndPointsStore(serviceMappings, jwksDelay);
                const validIssuers = serviceMappings.map(s => s.iss);
                const auth = new Authenticate(event.authToken, validIssuers, cachingService, event.logger);

                return auth.validate()
                    .then(() => event.logger.info({ function: self.func, log: 'cert structure validated' }))
                    .then(() => auth.getCertList())
                    .then(() => auth.checkAuthorisation())
                    .catch((err) => {
                        throw StatusCodeError.CreateFromSpecs([ErrorSpecs[err]], ErrorSpecs[err].statusCode)
                    });
            });
    }

    loadAdditionalServices({ env, region }) {
        const paramPrefix = `/${env}/`;
        this.services.parameter = ParameterService.Create({ env: { region }, paramPrefix });
    }

}

module.exports.run = (event, context, callback) => {
    const eventWithLogger = Object.assign(
        {},
        event,
        {
            logger: RequestLogger.Create({ service: 'jwt-authenticator' })
        }
    );
    return new JwtAuth().run(eventWithLogger, context, callback);
};
