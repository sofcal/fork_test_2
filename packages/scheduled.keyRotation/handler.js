'use strict';

const Promise = require('bluebird');
const DbQueries = require('./DbQueries');
const _ = require('underscore');
const ParameterStoreStaticLoader = require('internal-parameterstorestaticloader');
const serviceImpls = {
    DB: require('internal-services-db')
};

let env, region, database, params;

module.exports.keyRotation = (event, context, callback) => {
    const services = {};
    console.log('event', event);

    return Promise.resolve(undefined)
        .then(() => {
            env = event.env;
            region = event.region;
            database = event.database;

            if(!env || !region) {
                throw new Error(`invalid parameters - env: ${env}; region: ${region};`);
            }

            console.log(`starting request for - env: ${env}; region: ${region}`);
        })
        .then(() => getParams(env, region))
        .then((result) => {
            params = result;
            return getServices(env, region, params, services)
        })
        .then(() => connectDB(services, database))
        .then((db) => {
            return rotateOrgs(db,params);
        })
        .then(()=>{
            return services.db.disconnect()
                .then(()=>{
                    const response = {
                        statusCode: 200,
                        body: 'OK'
                    };
                    console.log('invoke callback');
                    callback(null, response);
                })
        })
        .catch((err) => {
            console.log('Failed with error:',err)
        })
};

const rotateOrgs = Promise.method((db, params)=>{
    const dbQueries = new DbQueries(db);
    let excludedProductIds;
    return getExcludedProductIds(dbQueries,params)
        .then((result)=>{
            excludedProductIds = result;
            console.log('excludedProductIds:', excludedProductIds);
        })
        .then(() => dbQueries.getOrgsToRotate(excludedProductIds))
        .then((orgRotateDetails) => {
            return Promise.each(orgRotateDetails, (rotateDetails)=>{
                console.log(`update token for Org:${rotateDetails._id} ProductId:${rotateDetails.productId}`);
                return dbQueries.updateOrgPrimaryToken(rotateDetails._id, rotateDetails.productId, rotateDetails.token, generateToken(), new Date());
            })
        })
});

let generateToken = function(){
    return require('crypto').randomBytes(32).toString('hex');
};

const getExcludedProductIds = Promise.method((dbQueries, params)=>{
    return dbQueries.getProducts()
        .then((products)=>{
            const excludedProductNames = params['keyRotation.exclusions'];
            let excludedIds = _.map(excludedProductNames, (excludedProductName) => {
                const product = _.find(products, (product) => {
                    if (product.header === excludedProductName) {
                        return product;
                    }
                });

                if (!product) {
                    throw new Error('Unable to find excluded product');
                }
                return product._id;
            });
            return excludedIds;
        })
});

const connectDB = (services, database) => {
    return services.db.connect(database)
        .then((db) => {
            console.log('db connected');
            return db;
        })
};

const getServices = (env, region, params, services) => {
    const username = params['defaultMongo.username'];
    const password = params['defaultMongo.password'];
    const replicaSet = params['defaultMongo.replicaSet'];
    const domain = params['domain'];

    services.db = new serviceImpls.DB({ env, region, domain, username, password, replicaSet });

    return services;
}

const getParams = (env, region) => {
    const keys = ['domain', 'defaultMongo.username','defaultMongo.password','defaultMongo.replicaSet','keyRotation.exclusions'];
    const paramPrefix = `/${env}/`;

    const params = {};
    console.log('retrieving keys', keys, paramPrefix);

    const loader = new ParameterStoreStaticLoader({keys, paramPrefix, env: { region } });
    return loader.load(params)
        .then(() => {
            const retrieved = Object.keys(params).length;
            if(!retrieved || retrieved < keys.length) {
                throw new Error('failed to retrieved params');
            }
            params['keyRotation.exclusions'] = JSON.parse(params['keyRotation.exclusions']);
            console.log(`retrieved keys - requested: ${keys.length}; retrieved: ${Object.keys(params).length}`);
            return params;
        });
};
