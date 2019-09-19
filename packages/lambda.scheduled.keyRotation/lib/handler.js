'use strict';

const Promise = require('bluebird');
const DbQueries = require('./dbQueries');
const _ = require('underscore');
const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const BcServicesDb = require('@sage/bc-services-db');
const crypto = require('crypto');
const { RequestLogger } = require('@sage/bc-requestlogger');

const serviceImpls = {
    DB: BcServicesDb
};

let env;
let region;
let dbName;
let params;
let logger;

module.exports.run = (event, context, callback) => {
    const services = {};
    const func = 'handler.run';

    // eslint-disable-next-line no-param-reassign
    event.logger = RequestLogger.Create({ service: 'scheduled-keyRotation' }, event.logLevel);
    ({ logger } = event);
    event.logger.info({ function: func, log: `started with event ${event}` });

    return Promise.resolve(undefined)
        .then(() => {
            ({ env } = event);
            ({ region } = event);
            dbName = event.database;

            if (!env || !region) {
                throw new Error(`invalid parameters - env: ${env}; region: ${region};`);
            }

            event.logger.info({ function: func, log: `starting request for - env: ${env}; region: ${region}` });
        })
        .then(() => getParams(env, region))
        .then((result) => {
            params = result;
            return getServices(env, region, params, services);
        })
        .then(() => connectDB(services))
        .then((db) => {
            return rotateOrgs(db, params);
        })
        .then(() => {
            return services.db.disconnect()
                .then(() => {
                    const response = {
                        statusCode: 200,
                        body: 'OK'
                    };
                    event.logger.info({ function: func, log: 'invoke callback' });
                    callback(null, response);
                });
        })
        .catch((err) => {
            event.logger.error({ function: func, log: 'an error occurred while processing the request', error: err.message || err });
        });
};

const rotateOrgs = Promise.method((db, _params) => {
    const func = 'handler.rotateOrgs';
    const dbQueries = new DbQueries(db);
    let excludedProductIds;
    return getExcludedProductIds(dbQueries, _params)
        .then((result) => {
            excludedProductIds = result;
            logger.info({ function: func, log: `excludedProductIds: ${excludedProductIds}` });
        })
        .then(() => dbQueries.getOrgsToRotate(excludedProductIds))
        .then((orgRotateDetails) => {
            return Promise.each(orgRotateDetails, (rotateDetails) => {
                logger.info({ function: func, log: `update token for Org:${rotateDetails._id} ProductId:${rotateDetails.productId}` });
                return dbQueries.updateOrgPrimaryToken(rotateDetails._id, rotateDetails.productId, rotateDetails.token, generateToken(), new Date());
            });
        });
});

let generateToken = function() {
    return crypto.randomBytes(32).toString('hex');
};

const getExcludedProductIds = Promise.method((dbQueries, _params) => {
    return dbQueries.getProducts()
        .then((products) => {
            const excludedProductNames = _params['keyRotation.exclusions'];
            return _.map(excludedProductNames, (excludedProductName) => {
                const product = _.find(products, (_product) => {
                    return _product.header === excludedProductName;
                });

                if (!product) {
                    throw new Error('Unable to find excluded product');
                }
                return product._id;
            });
        });
});

const connectDB = (services) => {
    const func = 'handler.connectDB';
    return services.db.connect()
        .then((db) => {
            logger.info({ function: func, log: 'db connected' });
            return db;
        });
};

const getServices = (env, region, _params, _services) => {
    const username = _params['defaultMongo.username'];
    const password = _params['defaultMongo.password'];
    const replicaSet = _params['defaultMongo.replicaSet'];
    const { domain } = _params;
    const services = _services;

    services.db = new serviceImpls.DB({ env, region, domain, username, password, replicaSet, db: dbName });

    return services;
};

const getParams = (env, region) => {
    const func = 'handler.getParams';
    const keys = ['domain', 'defaultMongo.username', 'defaultMongo.password', 'defaultMongo.replicaSet', 'keyRotation.exclusions'];
    const paramPrefix = `/${env}/`;

    const params = {};
    logger.info({ function: func, log: `retrieving keys ${keys} ${paramPrefix}` });

    const loader = new ParameterStoreStaticLoader({ keys, paramPrefix, env: { region } });
    return loader.load(params)
        .then(() => {
            const retrieved = Object.keys(params).length;
            if (!retrieved || retrieved < keys.length) {
                throw new Error('failed to retrieved params');
            }
            params['keyRotation.exclusions'] = JSON.parse(params['keyRotation.exclusions']);
            logger.info({ function: func, log: `retrieved keys - requested: ${keys.length}; retrieved: ${Object.keys(params).length}` });
            return params;
        });
};
