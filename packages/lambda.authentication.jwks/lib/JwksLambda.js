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
                        cacheExpiry: parseInt(cacheExpiry, 10),
                        refreshFunction: () => this.cacheRefresh({ logger })
                    };
                    this.cache = new Cache(options, { logger: event.logger });
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
                    .then((data) => this.validateData(data))
                    .then((data) => ({ keys: data }));
            });
    }

    validateData(data) {
        const [primary, secondary] = data;

        if (!this.isKeyFormat(primary) && !this.isKeyFormat(secondary)) {
                throw new Error('No valid key');
            }
        return data;
    }

    isKeyFormat(dataJson) {
        const availableKeys = ["kty", "alg", "use", "kid", "x5c"];

        let valid = true

        return Object.keys(dataJson).reduce((accumulator, key) => accumulator && availableKeys.includes(key), valid);

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

                const validPublicKeys = this.getListOfValidPublicKeys(data);
                const mapped = validPublicKeys.map(k => Jwks.Generate(k.publicKey, k.privateKey));
                logger.info({ function: func, log: 'ended' });
                return mapped;
            });
    }

    filterExpired(data) {
        const now = new Date().getTime();
        return data.filter( (k) => {
            return now < Number(k.createdAt) + (this.config.delay || 1000);
        });
    }

    /**
     * Creates a json object which only contains keys whiches allowed and has all the require attributes.
     * @param dataJson
     * @returns {*[]}
     */
    getListOfValidPublicKeys(dataJson) {
        let validPublicKeys = [];


        const allowedPrefixes = ['accessToken.primary.', 'accessToken.secondary.'];
        const allowedAttributes = ['publicKey', 'privateKey', 'createdAt'];


        const hasAllAttributes = (prefix) => {
            let noAttributeMissing = true;
            return allowedAttributes.reduce((accumulator, a) => dataJson[prefix + a] && accumulator, noAttributeMissing);
        }

        const createPublicKey = (prefix) => {
            let temp = {};
            allowedAttributes.forEach((a) => {
                temp[a] = dataJson[prefix + a];
            });
            return temp;
        }

        validPublicKeys = allowedPrefixes
            .filter(p => hasAllAttributes(p))
            .map(p => createPublicKey(p));

        return validPublicKeys;
    }
}

module.exports = JwksLambda;