'use strict';

const Promise = require('bluebird');

const ParameterStoreStaticLoader = require('internal-parameterstorestaticloader');
const serviceImpls = {
    DB: require('internal-services-db'),
    S3: require('internal-services-s3')
};

let env, region, database, bucket;

module.exports.run = (event, context, callback) => {
    const services = {};

    console.log('event', event);

    const oldEnv = event.env === 'dev01' ? 'qa' : 'prod';

    const bankIds = {
        'b84a7cb2-4802-45e4-bac7-891e844bac7b': {
            name: 'usbank', buckets: [`${oldEnv}-usbank`, `bnkc-${event.env}-s3-us-east-1-usbank`]
        },
        '1b29cae8-29d9-40b6-8925-125efa010c1d': {
            name: 'natwest', buckets: [`bankcloudirl${oldEnv}-natwest`,`bnkc-${event.env}-s3-eu-west-1-natwest`]
        },
        'fe9f88e8-7e17-4086-b668-b08045e6f087': {
            name: 'rbs', buckets: [`bankcloudirl${oldEnv}-rbs`,`bnkc-${event.env}-s3-eu-west-1-rbs`]
        },
        'a6333da7-17e2-4f37-a802-005331f5ca40': {
            name: 'aps', buckets: [`bankcloudirl${oldEnv}-aps`,`bnkc-${event.env}-s3-eu-west-1-aps`]
        },
        '41a2e599-1041-494d-89b5-84d03ad688fa': {
            name: 'lloyds', buckets: [`bankcloudirl${oldEnv}-lloyds`,`bnkc-${event.env}-s3-eu-west-1-lloyds`]
        },
        '453e8bd6-958a-49a4-8b4d-0dc571b98ba3': {
            name: 'hsbc', buckets: [`bankcloudirl${oldEnv}-hsbc`, `bnkc-${event.env}-s3-eu-west-1-hsbc`]
        }
    };

    return Promise.resolve(undefined)
        .then(() => {
            env = event.env;
            region = event.region;
            database = event.database;
            bucket = event.bucket;

            if(!env || !region) {
                throw new Error(`invalid parameters - env: ${env}; region: ${region};`);
            }

            console.log(`starting request for - env: ${env}; region: ${region}`);
        })
        .then(() => getParams(env, region))
        .then((params) => getServices(env, region, params, services))
        .then(() => connectDB(services, database))
        .then((db) => {

            // loop through ALL transactionBuckets
            // for each bucket
            // find bankAccount and extract bankId
            // loop through transactions
            // extract file date and file name
            // if file name doesn't exist on list for that bank, add it and the date

            const data = {
                // bank_name: { 'filename': date }
            };
            const Transaction = db.collection('Transaction');
            const BankAccount = db.collection('BankAccount');
            const limit = 100;

            const recursivePage = Promise.method((skip, total) => {
                console.log(`extracting ${skip}-${skip+limit} of ${total}`);
                return Transaction.find({}).skip(skip).limit(limit).toArray()
                    .then((buckets) => {
                        return Promise.map(buckets,
                            ({ bankAccountId, transactions }) => {
                                return BankAccount.findOne({ _id: bankAccountId })
                                    .then((ba) => {
                                        const bank = bankIds[ba.bankId];
                                        if(!bank) {
                                            // bank is not a direct file bank, so we don't care
                                            return;
                                        }

                                        const bankName = bank.name;

                                        if(!ba) {
                                            return;
                                        }

                                        if (!data[bankName]) {
                                            data[bankName] = {};
                                        }

                                        transactions.forEach((transaction) => {
                                            if (!transaction.raw) {
                                                return; // can't determine file name before raw info
                                            }

                                            const filename = transaction.raw.fileName;
                                            if (!data[bankName][filename]) {
                                                data[bankName][filename] = {
                                                    date: transaction.dateFileArrived,
                                                    id: transaction.fileIdentificationNumber
                                                };
                                            }
                                        });
                                    })
                                    .catch((err) => {
                                        // shouldn't happen, but just in case
                                    })
                            })
                            .then(() => {
                                // if we're not at the end of the data yet
                                if (buckets.length === 100) {
                                    return recursivePage(skip + 100, total);
                                }
                            })
                    })
            });

            if(event.continuation) {
                console.log('skipping db calls due to continuation');
                return services.s3.get('bankFileReport.json')
                    .then((data) => {
                        const json = data.Body.toString();
                        return JSON.parse(json);
                    })
            }

            console.log('extracting transaction count');
            return Transaction.count({})
                .then((total) => {
                    console.log('TOTAL BUCKETS', total);
                    return total;
                })
                .then((total) => recursivePage(0, total))
                .then(() => {
                    const json = JSON.stringify(data);

                    return services.s3.put('bankFileReport.json', Buffer.from(json), 'AES256')
                        .then(() => data);
                })
        })
        .then((data) => {
            if(event.skipS3) {
                console.log('skipping s3 calls due to skipS3');
                return undefined;
            }

            const missing = {};
            const matched = [];
            return Promise.map(Object.keys(bankIds),
                (bankId) => {
                    const bank = bankIds[bankId];
                    const keys = [];
                    return Promise.map(bank.buckets,
                        (bucket) => {
                            return services.s3.list(bucket)
                                .then((k) => {
                                    console.log('KEYS.LENGTH', k.length);
                                    keys.push(...k);
                                })
                        })
                        .then(() => {
                            const bankName = bank.name;
                            console.log(`Checking ${keys.length} files for ${bankName}`);
                            const entries = data[bankName];

                            keys.forEach((key) => {
                                if(!entries || !entries[key.Key]) {
                                    // skip anything we know is a test file
                                    if(key.Key.indexOf('TestFile') === -1) {
                                        if(!missing[bankName]) {
                                            missing[bankName] = [];
                                        }

                                        missing[bankName].push(key.Key);
                                    }
                                } else {
                                    matched.push(key.Key);
                                }
                            })
                        })
                })
                .then(() => {
                    const response = {
                        statusCode: 200,
                        body: JSON.stringify({
                            matched, missing
                        })
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

const connectDB = (services, database) => {
    return services.db.connect(database)
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

    services.db = new serviceImpls.DB({ env, region, domain, username, password, replicaSet });
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
