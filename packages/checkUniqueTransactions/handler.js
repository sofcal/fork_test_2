'use strict';

const Promise = require('bluebird');
const _ = require('underscore');

const ParameterStoreStaticLoader = require('internal-parameterstorestaticloader');
const serviceImpls = {
    DB: require('internal-services-db')
};

let env, region, bankId, duplicates;

module.exports.checkUniqueTransactions = (event, context, callback) => {
    const services = {};

    console.log('event', event);
    duplicates = [];

    return Promise.resolve(undefined)
        .then(() => {
            env = event.env;
            region = event.region;
            bankId = event.bankId;

            if(!env || !region || !bankId) {
                throw new Error(`invalid parameters - env: ${env}; region: ${region}; region: ${bankId}`);
            }

            console.log(`starting request for - env: ${env}; region: ${region}; region: ${bankId}`);
        })
        .then(() => getParams(env, region))
        .then((params) => getServices(env, region, params, services))
        .then(() => connectDB(services))
        .then((db) => {
            console.log(`starting process`);
            let cnBankAccount = db.collection('BankAccount');
            let cnTransaction= db.collection('Transaction');

            return cnBankAccount.find({bankId},{'_id':1}).toArray()
                .then((bankAccounts) => {
                    console.log('accounts returned', bankAccounts);
                    let bankAccountIds = _.pluck(bankAccounts, '_id');
                    console.log('bankaccountIds', bankAccountIds);
                    return bankAccountIds;
                })
                .then((bankAccountIds) => {
                    return Promise.each(bankAccountIds,((bankAccountId) => {

                        let accountTrans = [];
                        console.log('looking for: ' + bankAccountId);
                        return cnTransaction.find({'bankAccountId': bankAccountId}).toArray()
                            .then((buckets) => {
                                console.log(`retrieved buckets: ${buckets.length}`);
                                return buckets.forEach((currentBucket) => {
                                    console.log(`bucket ${currentBucket._id}: ${currentBucket.transactions.length}`);
                                    accountTrans = accountTrans.concat(currentBucket.transactions);
                                });
                            })
                            .then(() => {

                                console.log(`Compiled Transactions: ${accountTrans.length}`);
                                let grouped = _.groupBy(accountTrans, (transaction) => {
                                    return `${transaction.transactionNarrative}_${transaction.datePosted}_${transaction.transactionAmount}`;
                                });

                                for (let i in grouped) {
                                    let group = grouped[i];

                                    if (grouped.hasOwnProperty(i) && grouped[i].length > 1) {
                                        console.log(`${i} is a duplicate`);
                                        duplicates.push({
                                            bankAccountId: bankAccountId,
                                            transactionNarrative: group[0].transactionNarrative,
                                            transactionAmount: group[0].transactionAmount,
                                            datePosted: group[0].datePosted,
                                        });
                                    }
                                }
                            })
                    }))
                })
                .then(() => {
                    console.log('duplicates', duplicates);

                    if (!event.wet) {
                        throw new Error('dry run, skipping update');
                    }

                    const response = {
                        statusCode: 200,
                        body: JSON.stringify({
                            message: 'query complete',
                            duplicates: duplicates,
                            input: event,
                        }),
                    };

                    callback(null, response);

                })
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

    services.db = new serviceImpls.DB({ env, region, domain, username, password, replicaSet });

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

const connectDB = (services) => {
    return services.db.connect('bank_db')
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
