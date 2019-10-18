'use strict';

const Promise = require('bluebird');
const KeyValuePair = require('./KeyValuePair');
const redis = Promise.promisifyAll(require('redis'));

Promise.promisifyAll(redis.RedisClient.prototype);

// TODO: Consider use of contract for KeyValuePair to validate input
// Replicate Contract in ES6

class KeyValuePairCache {
    constructor(options) {
        this.connectionString = getConnectionString(options);
    }

    connect(...args) {
        return connectImpl(this, ...args)
            .catch(() => {
                throw new Error('Problem connecting to cache'); // TODO: Use StatusCodeError - explore usage
            });
    }
    // TODO: Lerna explore usage - Lerna.add(module)

    disconnect(...args) {
        return disconnectImpl(this, ...args);
    }

    storePair(...args) {
        return storePairImpl(this, ...args);
    }

    upsertPair(...args) {
        return storePairImpl(this, ...args);
    }

    retrievePair(...args) {
        return retrievePairImpl(this, ...args);
    }

    deletePair(...args) {
        return deletePairImpl(this, ...args);
    }
}

const connectImpl = Promise.method((self) => {
    // TODO: Error
    self.redisClient = redis.createClient(self.connectionString);
    return self.redisClient;
});

const disconnectImpl = Promise.method((self) => {
    if (self.redisClient) {
        return self.redisClient.quitAsync();
    }
    return null; // TODO: No connection to disconnect; handle more elegantly?
});

const getConnectionString = ({ env: awsEnv, region: awsRegion, localhost = false, connectionString }) => {
    if (connectionString) {
        // if we already have a connection string, we just return
        return connectionString;
    }

    if (localhost) {
        return `redis://127.0.0.1:6379`;
    }

    return `redis://elasticache.${awsEnv}.${awsRegion}.sagebanking-dev.cloud:6379$`;
};

const storePairImpl = Promise.method((self, kvp, ttl = 300) => {
    if (!(kvp instanceof KeyValuePair)) {
        throw new Error('Invalid Pair');
    }

    if (self.redisClient) {
        if (self.redisClient.connected) {
            return self.redisClient.setAsync(kvp.key, kvp.value, 'EX', ttl)
                .then(() => {
                    return kvp;
                })
                .catch(() => {
                    throw new Error('Problem writing to cache');
                });
        }
    }
    throw new Error('Not connected to cache');
});

const retrievePairImpl = Promise.method((self, key) => {
    if (!key) {
        throw new Error('Invalid Key');
    }

    if (self.redisClient) {
        if (self.redisClient.connected) {
            return self.redisClient.getAsync(key)
                .then((value) => {
                    if (value) {
                        return new KeyValuePair({ key, value });
                    }
                    throw new Error(`KeyValuePair not found: ${key}`);
                });
        }
    }
    throw new Error('Not connected to cache');
});

const deletePairImpl = Promise.method((self, key) => {
    if (!key) {
        throw new Error('Invalid Key');
    }

    if (self.redisClient) {
        if (self.redisClient.connected) {
            return self.redisClient.delAsync(key);
        }
    }
    throw new Error('Not connected to cache');
});

module.exports = KeyValuePairCache;
