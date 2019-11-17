'use strict';

const Promise = require('bluebird');
const KeyValuePair = require('./KeyValuePair');
const redis = Promise.promisifyAll(require('redis'));

Promise.promisifyAll(redis.RedisClient.prototype);

class KeyValuePairCache {
    constructor(options) {
        this.connectionString = getConnectionString(options);
    }

    connect(...args) {
        return connectImpl(this, ...args)
            .catch(() => {
                throw new Error('Problem connecting to cache');
            });
    }

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
    const resolver = Promise.defer();
    self.redisClient = redis.createClient(self.connectionString);

    self.redisClient.on('error', (err) => {
        resolver.reject(new Error(err));
    });

    self.redisClient.on('ready', () => {
        resolver.resolve(self.redisClient);
    });

    return resolver.promise();
});

const disconnectImpl = Promise.method((self) => {
    if (self.redisClient) {
        return self.redisClient.quitAsync();
    }
    return null;
});

const getConnectionString = ({ env: awsEnv, region: awsRegion, localhost = false, connectionString }) => {
    if (connectionString) {
        // if we already have a connection string, we just return
        return connectionString;
    }

    if (localhost) {
        return 'redis://127.0.0.1:6379';
    }

    return `redis://elasticache.${awsEnv}.${awsRegion}.sagebanking-dev.cloud:6379`;
};

const storePairImpl = Promise.method((self, kvp, ttl = 300) => {
    if (!(kvp instanceof KeyValuePair)) {
        throw new Error('Invalid Pair');
    }
    if (self.redisClient) {
        if (self.redisClient.connected) {
            const value = wrapValue(kvp.value);
            return self.redisClient.setAsync(kvp.key, value, 'EX', ttl)
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
                        const unwrappedValue = unwrapValue(value);
                        return new KeyValuePair({ key, value: unwrappedValue });
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
            return self.redisClient.delAsync(key)
                .catch(() => {
                    throw new Error('Problem deleting from cache');
                });
        }
    }
    throw new Error('Not connected to cache');
});

const wrapValue = ((value) => {
    const wrappedObject = { type: 'Object', value };
    return JSON.stringify(wrappedObject);
});

const unwrapValue = ((value) => {
    try {
        return JSON.parse(value).value;
    } catch (err) {
        throw new Error('Unable to parse response');
    }
});

module.exports = KeyValuePairCache;
