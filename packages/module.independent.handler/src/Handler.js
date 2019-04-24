'use strict';

const Promise = require('bluebird');

const { RequestLogger } = require('@sage/bc-requestlogger');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');
const { CloudWatchSubscription } = require('@sage/bc-infrastructure-cloudwatchsubscription');
const ErrorSpecs = require('./ErrorSpecs');

class Handler {
    constructor({ config, serviceId = '@sage/base-service-id' }) {
        if (new.target === Handler) {
            throw new Error('Handler should not be instantiated; extend Handler instead.');
        }

        this.services = {};
        this.config = config;
        this.serviceId = serviceId;

        this.initialised = false;
    }

    run(event, context, callback) {
        const func = 'handler.run';
        return Promise.resolve(undefined)
            .then(() => {
                // eslint-disable-next-line no-param-reassign
                event.logger = RequestLogger.Create({ service: this.serviceId });
                event.logger.info({ function: func, log: 'started' });

                this.validate(event, { logger: event.logger });
                return Promise.resolve(undefined)
                    .then(() => {
                        const { SumoLogicLambdaARN } = this.config;
                        if (!SumoLogicLambdaARN) {
                            return undefined;
                        }

                        event.logger.info({ function: func, log: 'initialising CloudWatch Subscription' });
                        // initialise the CloudWatchSubscription which pushes logs to the sumo logic lambda
                        return CloudWatchSubscription.Register(context.logGroupName, SumoLogicLambdaARN, event.logger);
                    })
                    .then(() => {
                        if (this.initialised) {
                            event.logger.info({ function: func, log: 'skipping services and add-ons' });
                            return undefined;
                        }

                        // give the derived instance an opportunity to initialise any services or add-ons that are required for the
                        // running of the function. Since this class should be instantiated once, it gives the ability to cache items
                        event.logger.info({ function: func, log: 'initialising services and add-ons' });
                        return this.init(event, { logger: event.logger })
                            .then((initialised = false) => {
                                this.initialised = initialised;
                            });
                    })
                    .then(() => {
                        // now that everything else is set-up and ready to go, call the implementation for handling this request.
                        // This will be the business logic for the invocation of the lambda.
                        event.logger.info({ function: func, log: 'invoking handler function' });
                        return this.impl(event, { logger: event.logger });
                    })
                    .then((ret) => {
                        // if we get a valid response, give the derived class the opportunity to modify the response before we send it
                        return this.buildResponse(ret, { logger: event.logger })
                            .then((response) => {
                                event.logger.info({ function: func, log: 'sending success response' });
                                event.logger.info({ function: func, log: 'ended' });

                                // first parameter of the callback is the error response, so should be null for valid responses
                                callback(...response);
                            });
                    });
            })
            .catch((err) => {
                // if we caught an error; we ensure it's either a valid error we can return, or a 500 internal.
                event.logger.error({
                    function: func,
                    log: 'an error occurred while processing the request',
                    error: err.message || err
                });

                return this.buildErrorResponse(err, { logger: event.logger })
                    .then((response) => {
                        event.logger.info({ function: func, log: 'sending failure response' });
                        // for the most part, we still invoke the callback without an error; however, if we want the lambda to
                        // automatically retry, passing an error as the first parameter will achieve this
                        callback(...response);
                    });
            })
            .finally(() => {
                // last but not least, give the option to the derived class to cleanup resources it created. E.G database
                // connections. Since lambdas can be frozen, we want to allow the derived class the option to cleanup or
                // persist.
                return this.dispose({ logger: event.logger });
            });
    }

    validate(/* event, { logger } */) { // eslint-disable-line class-methods-use-this
        return this.config;
    }

    init(/* event, { logger } */) { // eslint-disable-line class-methods-use-this
        // default behaviour is to do nothing
        return Promise.resolve(undefined);
    }

    impl(/* event, { logger } */) { // eslint-disable-line class-methods-use-this
        return Promise.reject(new Error('not implemented'));
    }

    buildResponse(ret, { logger }) { // eslint-disable-line class-methods-use-this
        return Promise.resolve(undefined)
            .then(() => {
                const func = `${Handler.name}.buildResponse`;
                logger.info({ function: func, log: 'building success response: 200' });
                return [null, { statusCode: 200, body: JSON.stringify(ret) }];
            });
    }

    buildErrorResponse(err, { logger }) { // eslint-disable-line class-methods-use-this
        return Promise.resolve(undefined)
            .then(() => {
                const func = `${Handler.name}.buildErrorResponse`;
                // if we caught an error; we ensure it's either a valid error we can return, or a 500 internal.
                const statusCodeError = StatusCodeError.is(err)
                    ? err
                    : StatusCodeError.CreateFromSpecs([ErrorSpecs.internalServer], ErrorSpecs.internalServer.statusCode);

                const response = statusCodeError.toDiagnoses();
                const status = statusCodeError.statusCode;

                logger.info({ function: func, log: `building failure response: ${status}` });
                // for the most part, we still invoke the callback without an error; however, if we want the lambda to
                // automatically retry, passing an error as the first parameter will achieve this
                return [err.failLambda ? err : null, { statusCode: status, body: JSON.stringify(response) }];
            });
    }

    dispose(/* { logger } */) { // eslint-disable-line class-methods-use-this
        // default behaviour is to do nothing
        return Promise.resolve(undefined);
    }
}

module.exports = Handler;
