const validate = require('./validators');

const { Handler } = require('@sage/bc-independent-lambda-handler');
const { Cache } = require('@sage/bc-data-cache');
const { JwtIssuer } = require('@sage/sfab-s2s-jwt-issuer');
const { Kid } = require('@sage/sfab-s2s-jwt-kid');
// TODO: tidy this up, make it export { ParameterService }
const ParameterService = require('@sage/bc-services-parameter');

const Promise = require('bluebird');

class JwtIssuerLambda extends Handler {
    constructor(config) {
        super(config);

        this.cache = null;
        this.issuer = null;
    }

    validate(event, debug) {
        // do any additional validation on the environment variables (this.config) or event here
        validate.config(this.config, debug);
        validate.event(event, debug);

        return super.validate(event, debug);
    }

    init(event, { logger }) {
        return Promise.resolve(undefined)
            .then(() => {
                const func = 'JwtIssuerLambda.impl';
                // one time instantiation - we'll re-use these
                logger.info({ function: func, log: 'started' });

                const { iss, newCertDelay, cacheExpiry } = this.config;

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

                if (!this.issuer) {
                    this.issuer = new JwtIssuer(this.cache, { iss, newCertDelay: parseInt(newCertDelay, 10) });
                }

                this.services.parameter = ParameterService.Create({ env: { region: this.config.AWS_REGION }, paramPrefix: '/dev01/' });
                logger.info({ function: func, log: 'ended' });

                // we don't want this function to be called for subsequent requests on this lambda instance
                return true;
            });
    }

    impl(event) {
        return Promise.resolve(undefined)
            .then(() => {
                const func = 'JwtIssuerLambda.impl';
                event.logger.info({ function: func, log: 'started' });

                const { expirySeconds } = this.config;

                // this will get wrapped in a 200 response
                return this.issuer.generate({ claims: {}, expiresIn: parseInt(expirySeconds, 10), algorithm: JwtIssuer.Algortithms.RS256 })
                    .then((jwt) => ({ jwt }));
            });
    }

    cacheRefresh({ logger }) {
        const func = 'JwtIssuerLambda.cacheRefresh';
        logger.info({ function: func, log: 'started' });

        const params = [
            'accessToken.primary.publicKey', 'accessToken.primary.privateKey', 'accessToken.primary.timestamp',
            'accessToken.secondary.publicKey', 'accessToken.secondary.privateKey', 'accessToken.secondary.timestamp',
        ];

        return this.services.parameter.getParameters(params)
            .then((data) => {
                const mapped = [{
                    status: 'primary',
                    private: data['accessToken.primary.privateKey'],
                    public: data['accessToken.primary.privateKey'],
                    timestamp: parseInt(data['accessToken.primary.timestamp'], 10),
                    kid: Kid.Generate(data['accessToken.primary.privateKey'])
                }, {
                    status: 'secondary',
                    private: data['accessToken.secondary.privateKey'],
                    public: data['accessToken.secondary.privateKey'],
                    timestamp: parseInt(data['accessToken.secondary.timestamp'], 10),
                    kid: Kid.Generate(data['accessToken.secondary.privateKey'])
                }];

                logger.info({ function: func, log: 'ended' });
                return mapped;
            });
    }

    cacheMap(input, { logger }) {
        return input;
    }
}

module.exports = JwtIssuerLambda;
