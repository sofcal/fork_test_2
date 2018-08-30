'use strict';

const MongoClient = require('mongodb').MongoClient;
const Promise = require('bluebird');

class DB {
    constructor({ env, region, domain, username, password, replicaSet }) {
        this.connectionString = getConnectionString(env, region, domain, username, password, replicaSet);
    }

    connect(...args) {
        return connectImpl(this, ...args);
    }

    disconnect(...args) {
        return disconnectImpl(this, ...args);
    }

    static Create(...args) {
        return new DB(...args);
    }
}

const connectImpl = Promise.method((self, database) => {
    return disconnectImpl(self)
        .then(() => connectPromise(self))
        .then((client) => {
            self.client = client;
            return client.db(database);
        })
});

const disconnectImpl = Promise.method((self) => {
    if(self.client) {
        self.client.close();
        self.client = null;
    }
});

const connectPromise = Promise.method((self) => {
    const url = self.connectionString;
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, (err, client) => {
            if (err) {
                reject(err);
            }

            resolve(client);
        });
    });
});

const getConnectionString = (awsEnv, awsRegion, domain, username, password, replicaSet) => {
    // eslint-disable-next-line no-param-reassign
    const hosts = [
        `mdb-a.${awsEnv}.${awsRegion}.${domain}:27017`,
        `mdb-b.${awsEnv}.${awsRegion}.${domain}:27017`,
        `mdb-c.${awsEnv}.${awsRegion}.${domain}:27017`
    ];

    // const hosts = ['localhost:27017'];

    const credentialsString = (username && password) ? `${username}:${password}@` : '';
    const replicaSetString = replicaSet ? `?replicaSet=${replicaSet}` : '';

    return `mongodb://${credentialsString}${hosts.join(',')}/bank_db${replicaSetString}`;
    // return `mongodb://${hosts.join(',')}/bank_db`;
};

module.exports = DB;
