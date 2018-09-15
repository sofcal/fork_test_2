'use strict';

const Promise = require('bluebird');

const ParameterStoreStaticLoader = require('internal-parameterstore-static-loader');
const serviceImpls = {
    DB: require('internal-services-db'),
    Encryption: require('internal-services-encryption'),
    Key: require('internal-services-key')
};

let env, region, keyAlias;
const keySpec = 'AES_256';
const dbName = 'bank_db';

module.exports.run = (event, context, callback) => {
    const services = {};

    console.log('event', event);

    return Promise.resolve(undefined)
        .then(() => {
            env = event.env;
            region = event.region;

            if(!env || !region) {
                throw new Error(`invalid parameters - env: ${env}; region: ${region}`);
            }

            console.log(`starting request for - env: ${env}; region: ${region}`);

            keyAlias = `alias/bnkc-${env}-kms-${region}-aggregator`;
        })
        .then(() => getParams(env, region))
        .then((params) => getServices(env, region, params, services))
        .then(() => connectDB(services))
        .then((db) => {
            let collection = db.collection('BankAccount');
            return collection.find({ dataProvider: 'indirect' }).toArray()
                .then((bankAccounts) => {
                    console.log(`retrieved bankAccounts - expected: ${event.expected}; actual: ${bankAccounts.length}`);

                    if(!event.wet) {
                        throw new Error('dry run, skipping update');
                    }

                    if(event.expected !== bankAccounts.length) {
                        throw new Error(`failed to retrieve expected number of bankAccounts - expected: ${event.expected}; actual: ${bankAccounts.length}`);
                    }

                    const results = { migrated: 0, skipped: 0, errors: [] };

                    return Promise.each(bankAccounts,
                        (bankAccount) => {
                            const hasAggregatorPrivateKey = !!(bankAccount.aggregatorPrivateKey && bankAccount.aggregatorPrivateKey.length);
                            console.log(`checking bankAccount - _id: ${bankAccount._id}; hasAggregatorPrivateKey: ${hasAggregatorPrivateKey}`);

                            if(!hasAggregatorPrivateKey) {
                                console.log(`skipping bankAccount, hasAggregatorPrivateKey: ${hasAggregatorPrivateKey}`);
                                results.skipped += 1;
                                return undefined;
                            }

                            return migratePrivateKey(services, bankAccount)
                                .then((key) => collection.updateOne({ _id: bankAccount._id }, { $set: { aggregatorPrivateKey: key }}))
                                .then(() => results.migrated += 1)
                                .catch((err) => {
                                    results.errors.push({ _id: bankAccount._id, err: err.message });
                                });
                        })
                        .then(() => {
                            const parsed = { migrated: results.migrated, skipped: results.skipped, errors: results.errors.length };
                            console.log('finished migrating private keys', parsed);
                            if(results.errors.length) {
                                console.log(results.errors);
                            }

                            const response = {
                                statusCode: 200,
                                body: JSON.stringify({
                                    message: 'migration complete',
                                    parsed,
                                    input: event,
                                }),
                            };

                            callback(null, response);
                        })
                });
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

    services.db = new serviceImpls.DB({ env, region, domain, username, password, replicaSet, db: dbName });
    services.key = new serviceImpls.Key({region});
    services.encryption = new serviceImpls.Encryption({});

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

const migratePrivateKey = Promise.method((services, bankAccount) => {
    return decrypt(services, bankAccount.aggregatorPrivateKey)
        .then((plain) => encrypt(services, plain))
        .then((encrypted) => {
            console.log(`${bankAccount.aggregatorPrivateKey} => ${encrypted}`);
            bankAccount.aggregatorPrivateKey = encrypted;

            return encrypted;
        })
});


const encrypt = Promise.method((services, data) => {
    const generateDataKey = () => {
        return services.key.generateDataKey({ keyId: keyAlias, keySpec})
            .then((response) => {
                return { plain: response.Plaintext, encrypted: response.CiphertextBlob }
            });
    };

    return services.encryption.envelopeEncrypt(data, generateDataKey)
        .then((envelope) => envelope.toString('hex'))
        .catch((err) => {
            console.log('error encrypting key', err);
            throw err;
        })
});

const decrypt = Promise.method((services, encrypted) => {
    const decryptDataKey = (encryptedKey) => {
        return services.key.decrypt({ payload: encryptedKey })
            .then((response) => response.Plaintext);
    };

    return services.encryption.envelopeDecrypt(new Buffer(encrypted, 'hex'), decryptDataKey)
        .then((response) => response.toString())
        .catch((err) => {
            console.log('error decrypting key', err);
            throw err;
        })
});
