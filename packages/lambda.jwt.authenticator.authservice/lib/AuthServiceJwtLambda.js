/* eslint-disable class-methods-use-this */

const { JwtAuthenticatorLambda } = require('@sage/sfab-s2s-jwt-authenticator-lambda');
const { Cache } = require('@sage/sfab-s2s-jwt-cache');
const ParameterService = require('@sage/bc-services-parameter');
const Promise = require('bluebird');

const GatewayRequestToken = require('./GatewayRequestToken.js');

const GATEWAY_NAME = 'gateway';

class AuthServiceJwtLambda extends JwtAuthenticatorLambda {
    constructor(config) {
        super(config);
    }

    static Create(...args) {
        return new AuthServiceJwtLambda(...args);
    }

    init(event, { logger }) {
        const func = `${JwtAuthenticatorLambda.name}.init`;
        logger.info({ function: func, log: 'started' });

        return Promise.resolve(undefined)
            .then(() => {
                const { cacheExpiry } = this.config;
                const paramPrefix = this.config.paramPrefix || `/${this.config.environment}/`;

                const options = {
                    cacheExpiry: parseInt(cacheExpiry, 10),
                    refreshFunction: () => this.cacheRefresh({ logger })
                };
                this.cache = Cache.Create(options, { logger: event.logger });

                this.services.parameter = ParameterService.Create({ env: { region: this.config.AWS_REGION }, paramPrefix });
            })
            .then(() => {
                logger.info({ function: func, log: 'ended' });
                return super.init(event, { logger });
            });
    }

    cacheRefresh({ logger }) {
        const func = `${AuthServiceJwtLambda.name}.cacheRefresh`;
        logger.info({ function: func, log: 'started' });

        const key = `${GATEWAY_NAME}/private-key`;

        return this.services.parameter.getParameters([key])
            .then((data) => {
                logger.info({ function: func, log: 'retrieved params', params: { count: data.length } });
                logger.info({ function: func, log: 'ended' });

                return { gatewayPrivateKey: data[key] };
            });
    }

    buildResponse(data, { logger }) {
        const func = `${JwtAuthenticatorLambda.name}.buildResponse`;
        logger.info({ function: func, log: 'started' });
        return this.cache.getData()
            .then((cached) => {
                return GatewayRequestToken.Generate(cached.gatewayPrivateKey, GATEWAY_NAME);
            })
            .then((overrideToken) => {
                const updated = Object.assign({}, data, { token: overrideToken });
                logger.info({ function: func, log: 'calling super to finish building response' });
                return super.buildResponse(updated, { logger });
            })
            .then((ret) => {
                logger.info({ function: func, log: 'ended' });
                return ret;
            });
    }
}

module.exports = AuthServiceJwtLambda;
