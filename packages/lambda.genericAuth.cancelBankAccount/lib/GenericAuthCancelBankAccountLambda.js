'use strict';

const AWS = require('aws-sdk');
const validate = require('./validators');
const ErrorSpecs = require('./ErrorSpecs');
const keys = require('./params');

const { StatusCodeError } = require('@sage/bc-common-statuscodeerror');
const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const DB = require('@sage/bc-services-db');
const { Handler } = require('@sage/bc-independent-lambda-handler');

const { DBQueries } = require('./db');
const serviceImpls = { DB };
const dbName = 'bank_db';

const access = require('safe-access');
const Promise = require('bluebird');
const _ = require('underscore');


class GenericAuthCancelBankAccountLambda extends Handler{
    constructor({ config }) {
        super({ config });
        this.dbName = dbName;
    }

    static Create(...args) {
        return new GenericAuthCancelBankAccountLambda(...args);
    }

    validate(event, { logger }) {
        validate.event(event, { logger });
        validate.config(this.config, { logger });
        return super.validate(event, logger);
    }

    init(event, {logger}) {
        const func = `${GenericAuthCancelBankAccountLambda.name}.init`;
        logger.info({function: func, log: 'started'});
        const {Environment: env = 'test', AWS_REGION: region = 'local'} = process.env;

        return Promise.resolve(undefined)
            .then(() => getParams({env, region}, event.logger))
            .then((params) => {
                this.params = params;
                populateServices(this.services, {env, region, params}, event.logger);
                return connectDB(this.services, event.logger)
                    .then(() => false);
            });
    }

    impl(event, { logger }) {
        const func = `${GenericAuthCancelBankAccountLambda.name}.impl`;

        let { body: { providerId, bankAccountId } } = event;
        logger.info({function: func, log: 'started', params: { providerId, bankAccountId }});

        const {Environment: env = 'test', AWS_REGION: region = 'local'} = process.env;

        let bankAccount = {
            _id: bankAccountId,
            status: 'cancelled'
        };

        const dbQueries = DBQueries.Create(this.services.db.getConnection());

        // use new contracts.  Status -  was actually maintained by BC anayway.
        return dbQueries.updateBankAccount({ bankAccount },  {logger })
            .then((ba) => this.invokeWebhook({logger, providerId, bankAccountId,  env , region }))
            .then(() => {
                event.logger.info({function: func, log: 'ended'});
                return {statusCode: 200, body: 'Success'};
            })
    }

    invokeWebhook({logger, providerId, bankAccountId, externalId, env, region}) {
        const func = `${GenericAuthCancelBankAccountLambda.name}.invokeWebhook`;
        logger.info({function: func, log: 'started', params: { bankAccountId, externalId, providerId}});

        return Promise.resolve()
            .then(() =>{
                const lambda = new AWS.Lambda({ apiVersion: '2015-03-31', region: process.env.AWS_REGION });
                const lambdaName = `papi-${env}-${region}-WebhooksOutbound`;

                const payload = {
                    body: {
                        providerId,
                        resourceId: bankAccountId,
                        eventType: 'resourceDeleted',
                        resourceType: 'bankAccount',
                        resourceUrl: 'NA',
                    }
                };

                let params = {
                    FunctionName: lambdaName,
                    InvocationType: 'Event',    // async
                    Payload: JSON.stringify(payload)
                };

                logger.info({function: func, log: 'invoking lambda', params: { lambdaFunctionName: lambdaName }});


                return lambda.invoke(params).promise()
                    .then((data) => {
                        if (!((data.StatusCode >= 200) && (data.StatusCode < 300))) {
                            const msg = `failed to invoke Lambda status code ${data.StatusCode}`;
                            throw new Error(msg);
                        }
                    })
                    .catch((err) => {
                        logger.error({ function: func, msg: 'error caught sending notification', params: { error: err.message || err } });
                        throw err;
                    });
                });
    }

    dispose({ logger }) { // eslint-disable-line class-methods-use-this
        return disconnectDB(this.services, logger);
    }
}

const getParams = ({ env, region }, logger) => {
    const func = 'handler.getParams';
    logger.info({ function: func, log: 'started' });

    const paramPrefix = `/${env}/`;
    const params = {};

    logger.info({ function: func, log: 'retrieving keys', keys, paramPrefix });
    const loader = ParameterStoreStaticLoader.Create({ keys, paramPrefix, env: { region } });
    return loader.load(params)
        .then((updated) => {
            const retrievedCount = Object.keys(updated).length;

            logger.info({ function: func, log: 'finished retrieving param-store keys', requested: keys.length, retrieved: retrievedCount });

            if (!retrievedCount || retrievedCount < keys.length) {
                throw StatusCodeError.CreateFromSpecs([ErrorSpecs.failedToRetrieveParameters], ErrorSpecs.failedToRetrieveParameters.statusCode);
            }

            logger.info({ function: func, log: 'ended' });
            return updated;
        });
};

const populateServices = (services, { env, region, params }, logger) => {
    const func = 'handler.getServices';
    logger.info({ function: func, log: 'started' });

    const {
        'defaultMongo.username': username,
        'defaultMongo.password': password,
        'defaultMongo.replicaSet': replicaSet,
        domain
    } = params;

    // eslint-disable-next-line no-param-reassign
    services.db = serviceImpls.DB.Create({ env, region, domain, username, password, replicaSet, db: 'bank_db' });

    // add any additional services that are created by the serviceLoader for the lambda

    logger.info({ function: func, log: 'ended' });
};

const connectDB = (services, logger) => {
    const func = 'handler.connectDB';
    logger.info({ function: func, log: 'started' });

    return services.db.connect()
        .then(() => {
            logger.info({ function: func, log: 'ended' });
        })
        .catch((err) => {
            console.log(err);
        });
};

const disconnectDB = Promise.method((services, logger) => {
    const func = 'handler.disconnectDB';
    logger.info({ function: func, log: 'started' });

    if (!services.db) {
        logger.info({ function: func, log: 'no db service' });
        return undefined;
    }

    return services.db.disconnect()
        .then(() => {
            logger.info({ function: func, log: 'ended' });
        });
});

module.exports = GenericAuthCancelBankAccountLambda;
