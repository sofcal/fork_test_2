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
                    .then((data) => this.validateData(data))
                    .then((data) => ({ keys: data }));
            });
    }

    validateData(data) {
        const primary = data[0];
        const secondary = data[1];

        if (!this.isKeyFormat(primary) && !this.isKeyFormat(secondary)) {
                throw new Error('No valid key');
            }
        return data;
    }

    isKeyFormat(dataJson) {
        const availableKeys = ["kty", "alg", "use", "kid", "x5c"];

        let valid = true

        return Object.keys(dataJson).reduce((accumulator, key) => accumulator && availableKeys.includes(key) && _.isString(dataJson[key]), valid );

    }

    cacheRefresh({ logger }) {
        const func = 'JwksLambda.cacheRefresh';
        logger.info({ function: func, log: 'started' });

        const params = [
            'accessToken.primary.publicKey', 'accessToken.secondary.publicKey'
        ];

        return this.services.parameter.getParameters(params)
            .then((data) => {
                const validPublicKeys = this.getListOfValidPublicKeys(data);
                const mapped = validPublicKeys.map(k => Jwks.Generate(k));
                logger.info({ function: func, log: 'ended' });
                return mapped;
            });
    }

    getListOfValidPublicKeys(dataJson) {
        const validKeys = ['accessToken.primary.publicKey', 'accessToken.secondary.publicKey'];
        return Object.keys(dataJson)
            .filter(key => validKeys.includes(key))
            .map(key => dataJson[key]);
    }

    cacheMap(input, { logger }) {
        return input;
    }
}

module.exports = JwksLambda;