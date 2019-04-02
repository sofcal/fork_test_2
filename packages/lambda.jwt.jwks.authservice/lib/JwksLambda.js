'use strict';

const validate = require('./validators');

const { Handler } = require('@sage/bc-independent-lambda-handler');
const { Cache } = require('@sage/sfab-s2s-jwt-cache');
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
                    this.cache = Cache.Create(options, { logger: event.logger });
                }

                this.services.parameter = ParameterService.Create({ env: { region: this.config.AWS_REGION }, paramPrefix: this.config.environment });
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
                    .then((data) => {
                        if (!data || _.isEmpty(data)) {
                            throw new Error('No valid JWKS found!');
                        }
                        return { keys: data };
                    });
            });
    }

    cacheRefresh({ logger }) {
        const func = 'JwksLambda.cacheRefresh';
        logger.info({ function: func, log: 'started' });
        const params = ['/wpb-auth/public-key', '/wpb-auth/public-key-last'];
        const keyNameEnums = [
            {
                privateKey: '/wpb-auth/public-key',
                publicKey: '/wpb-auth/public-key',
                createdAt: Math.floor(Date.now() / 1000)
            },
            {
                privateKey: '/wpb-auth/public-key-last',
                publicKey: '/wpb-auth/public-key-last',
                createdAt: Math.floor(Date.now() / 1000)
            }
        ];

        return this.services.parameter.getParameters(params)
            .then((data) => {
                // for each keyNameEnum object (which contains the keyIds for our param-store values), check all the properties
                // are valid, and generate a JWKS
                const mapped = keyNameEnums
                    .filter((k) => Jwks.isValid(data[k.publicKey], data[k.privateKey], parseInt(data[k.createdAt], 10), parseInt(this.config.certExpiry, 10)))
                    .map((k) => Jwks.Generate(data[k.publicKey], data[k.privateKey]));

                logger.info({ function: func, log: 'ended' });
                return mapped;
            });
    }
}

module.exports = JwksLambda;