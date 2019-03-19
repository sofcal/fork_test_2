/* eslint-disable no-console,prefer-template */
const validate = require('./validators');
const Promise = require('bluebird');

const { Handler } = require('@sage/bc-default-lambda-handler');
const ParameterService = require('@sage/bc-parameterstore-static-loader');
const { RequestLogger } = require('@sage/bc-request-logger');
const { Authenticate, utils: { refreshFn, mappingFn } } = require('@sage/bc-jwt-authenticator');
const { EndpointsStore } = require('@sage/bc-endpoints-store');
const { Cache } = require('@sage/bc-data-cache');
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
                        event.logger.info({ function: self.func, log: 'ended' });
                        return res;
                    })
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
