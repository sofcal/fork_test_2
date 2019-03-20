'use strict';

const validate = require('./validators');

const { Handler } = require('@sage/bc-independent-lambda-handler');
const { Cache } = require('@sage/bc-data-cache');
const { Jwks } = require('@sage/sfab-s2s-jwt-jwks');
// TODO: tidy this up, make it export { ParameterService }
const ParameterService = require('@sage/bc-services-parameter');

const Promise = require('bluebird');
const _ = require('underscore');

class JwksLambda extends Handler {
    constructor(config) {
        super(config);

        this.cache = null;
    }

    static Create(...args) {
        return new JwksLambda(...args);
    }

    validate(event, debug) {
        // do any additional validation on the environment variables (this.config) or event here
        validate.event(this.config, debug);
        validate.event(event, debug);

        return super.validate(event, debug);
    }

    init(event, { logger }) {
        return Promise.resolve(undefined)
            .then(() => {
                const func = 'JwksLambda.impl';
                // one time instantiation - we'll re-use these
                logger.info({ function: func, log: 'started' });

                const { cacheExpiry } = this.config;

                if (!this.cache) {
                    const options = {
                        endpoint: 'deprecated',
                        cacheExpiry: parseInt(cacheExpiry, 10),
                        logger: event.logger,
                        refreshFunction: () => this.cacheRefresh({ logger }),
                        mappingFunction: (...args) => this.cacheMap(...args, { logger })
                    };
                    this.cache = new Cache(options);
                }

                this.services.parameter = ParameterService.Create({ env: { region: this.config.AWS_REGION }, paramPrefix: '/dev01/' });
                logger.info({ function: func, log: 'ended' });
            });
    }

    impl(event) {
        return Promise.resolve(undefined)
            .then(() => {
                const func = 'JwksLambda.impl';
                event.logger.info({ function: func, log: 'started' });

                // this will get wrapped in a 200 response
                return this.cache.getData()
                    //.then((data) => this.filterExpired(data))
                    .then((data) => Jwks.validateKeyData(data))
                    .then((data) => ({ keys: data }));
            });
    }

    cacheRefresh({ logger }) {
        const func = 'JwksLambda.cacheRefresh';
        logger.info({ function: func, log: 'started' });

        const params = [
            'accessToken.primary.privateKey', 'accessToken.primary.publicKey', 'accessToken.primary.createdAt',
            'accessToken.secondary.privateKey', 'accessToken.secondary.publicKey', 'accessToken.secondary.createdAt'
        ];

        return this.services.parameter.getParameters(params)
            .then((data) => {

                const validPublicKeys = Jwks.getListOfValidPublicKeys(data);
                const mapped = validPublicKeys.map(k => Jwks.Generate(k.publicKey, k.privateKey));
                logger.info({ function: func, log: 'ended' });
                return mapped;
            });
    }

    cacheMap(input, { logger }) {
        return input;
    }
}

module.exports = JwksLambda;