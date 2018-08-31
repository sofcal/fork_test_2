'use strict';

const Promise = require('bluebird');

const ParameterStoreStaticLoader = require('internal-parameterstorestaticloader');
const serviceImpls = {
    DB: require('internal-services-db')
};

let env, region, bankId, duplicates, quarantinedFile;

module.exports.run = (event, context, callback) => {
    const services = {};

    console.log('event', event);
    duplicates = [];

    return Promise.resolve(undefined)
        .then(() => {
            env = event.env;
            region = event.region;
            bankId = event.bankId;

            if (!env || !region || !bankId) {
                throw new Error(`invalid parameters - env: ${env}; region: ${region}; region: ${bankId}`);
            }

            console.log(`starting request for - env: ${env}; region: ${region}; region: ${bankId}; quarantine: ${quarantinedFile}`);
        })
        .then(() => getParams(env, region))
        .then((params) => getServices(env, region, params, services))
        .then(() => connectDB(services))
        .then((db) => {
            console.log(`starting process`);
            let cnTransaction = db.collection('Transaction');
            let cnQuarantine = db.collection('Quarantine');

            console.log(`Retrieving Quarantine Buckets`);

            return cnQuarantine.find({'s3FileName': event.quarantinedFile}).toArray()
                .then((quarantineBuckets) => {
                    console.log(`Retrieved ${quarantineBuckets.length} Quarantine Buckets`);
                    return Promise.map(quarantineBuckets, (bucket) => {

                        console.log(`Looping transactions for ${bucket._id}`);

                        return Promise.each(bucket.transactions, (transaction) => {
                            console.log(`quarantined transaction:\nDatePosted: ${transaction.datePosted.toISOString()}\nTransactionAmount: ${transaction.transactionAmount}\n${transaction.transactionNarrative}`);

                            //do the BDB lookup here

                            let transFilter = [
                                    {$match: {
                                        'bankAccountId': transaction.bankAccountId,
                                        'transactions.bankAccountId': transaction.bankAccountId,
                                        'transactions.datePosted': new Date(transaction.datePosted),
                                        'transactions.transactionNarrative': transaction.transactionNarrative,
                                        'transactions.transactionAmount': transaction.transactionAmount
                                    }},
                                {$project: {
                                        releasedTransactions: {$filter: {
                                                input: '$transactions',
                                                as: 'transactions',
                                                cond: {$eq: ['$$transactions.datePosted', new Date(transaction.datePosted)]}
                                            }},
                                        _id: 0
                                    }}];

                            console.log('about to query',transFilter);
                            return cnTransaction.aggregate(transFilter).toArray()
                                .then((matchingReleased) => {
                                    console.log(`Found ${matchingReleased.length} matching released transactions`);

                                    if (matchingReleased.length) {
                                        console.log('DUPLICATES FOUND');
                                        duplicates.push({
                                            bankAccountId: transaction.bankAccountId,
                                            datePosted: transaction.datePosted,
                                            transactionNarrative: transaction.transactionNarrative,
                                            transactionAmount: transaction.transactionAmount,
                                            originalFile: transaction.raw.filename
                                        });
                                    }

                                });

                        });
                    }, {concurrency: 1});
                });
        })
        .then(() => {
            console.log(`Logging out the count of dupes here`);
            if (!event.wet) {
                throw new Error('dry run, skipping update');
            }

            const response = {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'query complete',
                    duplicates: {
                        qty: duplicates.length,
                        data: duplicates
                    },
                    input: event,
                }),
            };

            callback(null, response);

        })
        .catch((err) => {
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
        .finally(() => {
            return disconnectDB(services);
        })
};

const getServices = (env, region, params, services) => {
    const username = params['defaultMongo.username'];
    const password = params['defaultMongo.password'];
    const replicaSet = params['defaultMongo.replicaSet'];
    const domain = params['domain'];

    services.db = new serviceImpls.DB({env, region, domain, username, password, replicaSet});

    return services;
};

const getParams = (env, region) => {
    const keys = ['domain', 'defaultMongo.username', 'defaultMongo.password', 'defaultMongo.replicaSet'];
    const paramPrefix = `/${env}/`;

    const params = {};

    console.log('retrieving keys', keys, paramPrefix);

    const loader = new ParameterStoreStaticLoader({keys, paramPrefix, env: {region}});
    return loader.load(params)
        .then(() => {
            const retrieved = Object.keys(params).length;
            if (!retrieved || retrieved < keys.length) {
                throw new Error('failed to retrieved params');
            }

            console.log(`retrieved keys - requested: ${keys.length}; retrieved: ${Object.keys(params).length}`);
            return params;
        });
};

const connectDB = (services) => {
    return services.db.connect('bank_db')
        .then((db) => {
            console.log('db connected');
            return db;
        })
};

const disconnectDB = Promise.method((services) => {
    if (services.db) {
        return services.db.disconnect();
    }
});
