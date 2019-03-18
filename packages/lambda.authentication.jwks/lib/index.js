const validate = require('./validators');

const { Handler } = require('@sage/bc-independent-lambda-handler');
const { Cache } = require('@sage/bc-data-cache');
const { Jwks } = require('@sage/sfab-s2s-jwt-jwks');
// TODO: tidy this up, make it export { ParameterService }
const ParameterService = require('@sage/bc-services-parameter');

const Promise = require('bluebird');

class JwksLambda extends Handler {
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
                const func = 'JwksLambda.impl';
                // one time instantiation - we'll re-use these
                logger.info({ function: func, log: 'started' });
                if (!this.cache) {
                    const options = {
                        endpoint: 'deprecated',
                        cacheExpiry: 10000,
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
                    .then((data) => ({ keys: data }));
            });
    }

    cacheRefresh({ logger }) {
        const func = 'JwksLambda.cacheRefresh';
        logger.info({ function: func, log: 'started' });

        const params = [
            'accessToken.primary.publicKey', 'accessToken.secondary.publicKey'
        ];

        return this.services.parameter.getParameters(params)
            .then((data) => {
                const mapped = [
                    Jwks.Generate(data['accessToken.primary.publicKey']),
                    Jwks.Generate(data['accessToken.secondary.publicKey'])
                ];

                logger.info({ function: func, log: 'ended' });
                return mapped;
            });
    }

    cacheMap(input, { logger }) {
        return input;
    }
}

const issuer = new JwksLambda();
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);