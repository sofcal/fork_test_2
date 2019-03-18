const validate = require('./validators');

const { Handler } = require('@sage/bc-independent-lambda-handler');
const { Cache } = require('@sage/bc-data-cache');
const { JwtIssuer } = require('@sage/sfab-s2s-jwt-issuer');
// TODO: tidy this up, make it export { ParameterService }
const ParameterService = require('@sage/bc-services-parameter');

const Promise = require('bluebird');

class JwtIssuerLambda extends Handler {
    constructor() {
        super({ config: process.env });

        this.cache = null;
        this.issuer = null;
    }

    impl(event) {
        return Promise.resolve(undefined)
            .then(() => {
                const func = 'JwtIssuerLambda.impl';
                event.logger.info({ function: func, log: 'started' });

                // this will get wrapped in a 200 response
                return this.issuer.generate({}, 1000, JwtIssuer.Algortithms.RS256);
            });
    }

    init(event, { logger }) {
        // one time instantiation - we'll re-use these
        if (!this.cache) {
            const options = {
                endpoint: 'deprecated',
                cacheExpiry: 10000,
                logger: event.logger,
                refreshFunction: (...args) => this.cacheRefresh(...args),
                mappingFunction: (...args) => this.cacheMap(...args)
            };
            this.cache = new Cache(options);
        }

        if (!this.issuer) {
            const iss = 'temp';
            const newCertDelay = 1;

            this.issuer = new JwtIssuer(this.cache, { iss, newCertDelay });
        }

        this.services.parameter = ParameterService.Create({ env: { region }, paramPrefix: '/auth_temp/' });
    }

    validate(event, { logger }) {
        // do any additional validation on the environment variables (this.config) or event here
        validate.event(event);

        return super.validate(event, { logger });
    }

    cacheRefresh(event, { logger }) {
        const func = 'JwtIssuerLambda.impl';
        logger.info({ function: func, log: 'started' });

        const params = [
            'accessToken.primary.publicKey', 'accessToken.primary.privateKey', 'accessToken.primary.timestamp',
            'accessToken.secondary.publicKey', 'accessToken.secondary.privateKey', 'accessToken.secondary.timestamp',
        ];

        return this.services.parameter.getParameters(params)
            .then((data) => {
                console.log('data', data);

                logger.info({ function: func, log: 'ended' });
            })
    }

    cacheMap(input) {
        return input;
    }
}

const issuer = new JwtIssuerLambda();
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);
