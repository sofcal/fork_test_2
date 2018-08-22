'use strict';

const Promise = require('bluebird');
const DbQueries = require('./DbQueries');
const _ = require('underscore');
const ParameterStoreStaticLoader = require('internal-parameterstorestaticloader');
const serviceImpls = {
    DB: require('internal-services-db')
};

let env, region, database, params;

module.exports.actualActionsProcessor = (event, context, callback) => {
    const services = {};
    console.log('event', event);

    // log out messages from SQS
    event.Records.forEach((record)  => {
        var body = record.body;
        console.log(body);
      });

    return Promise.resolve(undefined)
        .then(() => {
            env = event.env;
            region = event.region;

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
        .then(() => connectDB(services))
        .then((db) => {
            console.log('Connected to the DB and read params succesfully');
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

const connectDB = (services) => {
    return services.db.connect()
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
    const keys = ['domain', 'defaultMongo.username','defaultMongo.password','defaultMongo.replicaSet'];
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
            
            console.log(`retrieved keys - requested: ${keys.length}; retrieved: ${Object.keys(params).length}`);
            return params;
        });
};
