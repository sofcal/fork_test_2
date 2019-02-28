'use strict';

const Promise = require('bluebird');

const ParameterStoreStaticLoader = require('@sage/bc-parameterstore-static-loader');
const serviceImpls = {
    DB: require('@sage/bc-services-db'),
    S3: require('@sage/bc-services-s3')
};

let env, region, dbName, bucket;

module.exports.run = (event, context, callback) => {
    const services = {};

    console.log('event', event);

    return Promise.resolve(undefined)
        .then(() => {
            env = event.env;
            region = event.region;
            dbName = event.database;
            bucket = event.bucket;

            if(!env || !region) {
                throw new Error(`invalid parameters - env: ${env}; region: ${region};`);
            }

            console.log(`starting request for - env: ${env}; region: ${region}`);
        })
        .then(() => getParams(env, region))
        .then((params) => getServices(env, region, params, services))
        .then(() => connectDB(services))
        .then((db) => {
            const multiRegion = [];
            const orgsByProduct = {};

            const ids = [
                { bankIdentifier: '123456', accountIdentifier: '77691886' }
            ];

            console.log('searching bankAccountIdentifiers');
            return Promise.map(ids,
                ({bankIdentifier, accountIdentifier}) => {
                    return db.collection('BankAccount').find({ bankIdentifier, accountIdentifier }).toArray()
                        .then((bas) => {
                            if (!bas || !bas.length) {
                                return;
                            }

                            if (bas.length > 1) {
                                console.log('FOUND MULTIPLE BANK ACCOUNTS FOR IDENTIFIER')
                            }

                            const ba = bas[0];

                            return db.collection('Organisation').find({ _id: ba.organisationId }).toArray()
                                .then((orgs) => {
                                    if (!orgs || !orgs.length) {
                                        multiRegion.push(ba.organisationId);
                                        return;
                                    }

                                    const org = orgs[0];
                                    const product = org.products[0];

                                    if (!orgsByProduct[product.productId]) {
                                        orgsByProduct[product.productId] = [];
                                    }

                                    orgsByProduct[product.productId].push({
                                        organisationId: org._id, adminEmail: org.adminEmail, crmId: org.crmId
                                    });
                                })
                                .catch((err) => {
                                    console.log('error getting org data');
                                    console.log(err);
                                    multiRegion.push(ba.organisationId);
                                })
                        })
                })
                .then(() => {
                    const productIds = {
                        '35e1bc00-7183-408f-b363-a3a8eaeb2162': 'sage.live',
                        'ee5f3bda-b8be-4c2b-a08f-9bfce0c48454': 'sage.live.accountant',
                        'ad3544e2-f959-42da-86c5-34e3a4db5a72': 'sage.one',
                        '2ac2a370-6f73-4be4-b138-08eb9f2e7992': 'sage.uki.50.accounts',
                        'a70e3079-a931-4a39-aa52-49afbce97005': 'sage.uki.200.accounts',
                        '45247b1f-e23c-4158-998c-a1f886e42ab8': 'sage.us.50.accounts',
                        'dfb0fffc-af07-4c8a-9126-68e4ab945832': 'sage.ca.50.accounts',
                        '97f054f1-3660-4f6f-a3e2-4cfd603ede68': 'sage.es.50.accounts',
                        '7a4db519-67a0-44b2-891d-70814e80d81c': 'sage.us.100.contractor',
                        '8d41dee7-df82-4643-a88e-70ffce3d23c7': 'sage.ca.100.contractor',
                        'b2967e8f-a249-4ef8-aa6d-d23b56c4aff7': 'sage.es.200.accounts',
                        '62fc6ea8-4dae-4d67-acdb-1c8d64862d36': 'sage.migration'
                    };

                    const counts = {};
                    Object.keys(orgsByProduct).forEach((key) => {
                        const data = orgsByProduct[key];
                        const name = productIds[key] || key;

                        counts[name] = data.length;
                        delete orgsByProduct[key];
                        orgsByProduct[name] = data;
                    });

                    const json = JSON.stringify({
                        multiRegion,
                        orgsByProduct,
                        counts
                    });

                    return services.s3.put('incident_info.json', Buffer.from(json), 'AES256');
                })
                .then(() => {
                    const response = {
                        statusCode: 200,
                        body: `data uploaded to: ${bucket}/incident_info.json`,
                    };

                    callback(null, response);
                })
        })
        .catch((err) => {
            console.log('ERROR IN SCRIPT');
            console.log(err);
            const response = {
                statusCode: 400,
                body: JSON.stringify({
                    message: err.message,
                    input: event,
                }),
            };

            callback(null, response)
        })
        .then(() => disconnectDB(services))
};

const connectDB = (services) => {
    return services.db.connect()
        .then((db) => {
            console.log('db connected');
            return db;
        })
};

const disconnectDB = Promise.method((services) => {
    if(services.db) {
        return services.db.disconnect();
    }
});

const getServices = (env, region, params, services) => {
    const username = params['defaultMongo.username'];
    const password = params['defaultMongo.password'];
    const replicaSet = params['defaultMongo.replicaSet'];
    const domain = params['domain'];

    services.db = new serviceImpls.DB({ env, region, domain, username, password, replicaSet, db: dbName });
    services.s3 = new serviceImpls.S3({bucket});

    return services;
};

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
