'use strict';

const { MongoClient } = require('mongodb');
const Promise = require('bluebird');

class DB {
    constructor(options) {
        this.connectionString = getConnectionString(options);
        this.sslCA = options.sslCA;
        this._MongoClient = MongoClient;
    }

    connect(...args) {
        return connectImpl(this, ...args);
    }

    disconnect(...args) {
        return disconnectImpl(this, ...args);
    }

    getConnection() {
        if (!this.client) {
            return null;
        }

        return this.client.db();
    }

    static Create(...args) {
        return new DB(...args);
    }
}

const connectImpl = Promise.method((self) => {
    const url = self.connectionString;

    const options = {};
    if (self.sslCA) {
        Object.assign(options, { ssl: true, sslCA: self.sslCA });
    }

    return self._MongoClient.connect(url, (Object.keys(options).length ? options : undefined))
        .then((client) => {
            self.client = client; // eslint-disable-line no-param-reassign
            return client.db();
        });
});

const disconnectImpl = Promise.method((self) => {
    if (!self.client) {
        return undefined;
    }

    return self.client.close()
        .then(() => {
            self.client = null; // eslint-disable-line no-param-reassign
        });
});

const getConnectionString = ({ env: awsEnv, region: awsRegion, domain, username, password, replicaSet, db, localhost = false, connectionString }) => {
    if (connectionString) {
        // if we already have a connection string, we just return
        return connectionString;
    }

    if (localhost) {
        return `mongodb://localhost:27017/${db}`;
    }

    const hosts = [
        `mdb-a.${awsEnv}.${awsRegion}.${domain}:27017`,
        `mdb-b.${awsEnv}.${awsRegion}.${domain}:27017`,
        `mdb-c.${awsEnv}.${awsRegion}.${domain}:27017`
    ];

    const credentialsString = (username && password) ? `${username}:${password}@` : '';
    const replicaSetString = replicaSet ? `?replicaSet=${replicaSet}` : '';

    return `mongodb://${credentialsString}${hosts.join(',')}/${db}${replicaSetString}`;
};

module.exports = DB;
