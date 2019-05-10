/* eslint-disable class-methods-use-this */

const validate = require('./validators');
const resources = require('./resources');

const createKeyPair = require('./helpers/createKeyPair');
const createParams = require('./helpers/createParams');

const { Handler } = require('@sage/bc-independent-lambda-handler');
const { FuzzyAccess } = require('@sage/bc-util-fuzzyaccess');
const ParameterService = require('@sage/bc-services-parameter');

const Promise = require('bluebird');

class CertificateRotationLambda extends Handler {
    constructor(config) {
        super(config);

        this.cache = null;
    }

    static Create(...args) {
        return new CertificateRotationLambda(...args);
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
                const func = `${CertificateRotationLambda.name}.init`;
                logger.info({ function: func, log: 'started' });
                const { AWS_REGION } = FuzzyAccess.GetMany(this.config, ['AWS_REGION']);
                const paramPrefix = FuzzyAccess.Get(this.config, 'paramPrefix') || `/${FuzzyAccess.Get(this.config, 'environment')}/`;

                this.services.parameter = ParameterService.Create({ env: { region: AWS_REGION }, paramPrefix });
                logger.info({ function: func, log: 'ended' });

                // one time instantiation - we'll re-use these
                return true;
            });
    }

    impl(event) {
        const func = `${CertificateRotationLambda.name}.impl`;
        return Promise.resolve(undefined)
            .then(() => {
                event.logger.info({ function: func, log: 'started' });

                const keyNames = [
                    resources.keyNames.primary.public,
                    resources.keyNames.primary.private,
                    resources.keyNames.secondary.public,
                    resources.keyNames.secondary.private
                ];

                return this.services.parameter.getParameters(keyNames)
                    .then((values) => {
                        const requested = keyNames.length;
                        const retrieved = values.length;
                        event.logger.info({ function: func, log: 'retrieved params from param-store', params: { requested, retrieved } });
                        // assign the current primary values to our secondary
                        const secondaryKeyPair = {
                            public: values[resources.keyNames.primary.public],
                            private: values[resources.keyNames.primary.private]
                        };

                        event.logger.info({ function: func, log: 'creating new primary key pair' });
                        const primaryKeyPair = createKeyPair({ logger: event.logger });

                        event.logger.info({ function: func, log: 'building param-store values' });
                        const params = createParams(primaryKeyPair, secondaryKeyPair, { logger: event.logger });

                        event.logger.info({ function: func, log: 'updating values in param-store' });
                        return Promise.resolve(undefined)
                            .then(() => {
                                return Promise.map(params.secondary, // eslint-disable-line function-paren-newline
                                    (p) => {
                                        event.logger.info({ function: func, log: 'updating value in param-store', params: { name: p.name } });
                                        return this.services.parameter.setParameter(p);
                                    }); // eslint-disable-line function-paren-newline
                            })
                            .then(() => {
                                return Promise.map(params.primary, // eslint-disable-line function-paren-newline
                                    (p) => {
                                        event.logger.info({ function: func, log: 'updating value in param-store', params: { name: p.name } });
                                        return this.services.parameter.setParameter(p);
                                    }); // eslint-disable-line function-paren-newline
                            })
                            .then(() => {
                                event.logger.info({ function: func, log: 'ended' });
                                return { result: 'success' };
                            });
                    });
            })
            .catch((err) => {
                event.logger.error({ function: func, log: 'caught error during rotation', params: { err: err.message || err } });
                throw err;
            });
    }
}

module.exports = CertificateRotationLambda;
