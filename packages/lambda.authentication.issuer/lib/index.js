const validate = require('./validators');

const { Handler } = require('@sage/bc-independent-lambda-handler');
const { JwtIssuer } = require('@sage/sfab-s2s-jwt-issuer');

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
                const func = 'JwtIssuer.impl';
                event.logger.info({ function: func, log: 'started' });

                // perform validation on the event object.
                validate.event(event);

                // this will get wrapped in a 200 response
                return this.issuer.generate({}, 1000, JwtIssuer.Algortithms.RS256);
            });
    }

    init() {
        // one time instantiation - we'll re-use these
        if (!this.cache) {
            this.cache = {};
        }

        if (!this.issuer) {
            const iss = 'temp';
            const newCertDelay = 1;

            this.issuer = new JwtIssuer(this.cache, { iss, newCertDelay });
        }
    }

    validate({ logger }) {
        // do any additional validation on the environment variables (this.config) here
        return super.validate({ logger });
    }
}

const issuer = new JwtIssuerLambda();
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);
