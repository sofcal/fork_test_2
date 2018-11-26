'use strict';

// project

// internal modules
const { Readable } = require('stream');
const getBucketName = require('./getBucketName');

// external modules
const Promise = require('bluebird');
const moment = require('moment');
const _ = require('underscore');

const consts = {
    KEY_PREFIX: 'mi'
};

class BlobStorage {
    constructor({ s3, thisRegion, otherRegion, env, bucketName }) {
        this.s3 = s3;

        this.thisBucket = getBucketName({ env, region: thisRegion, bucketName });
        this.otherBucket = getBucketName({ env, region: otherRegion, bucketName });
    }

    storeResults(...args) {
        return storeResultsImpl(this, ...args);
    }

    getResults(...args) {
        return getResultsImpl(this, ...args);
    }
}

const getResultsImpl = Promise.method((self, { keyPostfix, other = false }) => {
    const key = `${consts.KEY_PREFIX}/${moment.utc().format('YYYY-MM-DD')}/${keyPostfix}.json`;
    const bucket = other ? self.otherBucket : self.thisBucket;

    console.log('getResultsImpl', bucket, key);
    return self.s3.get(key, bucket)
        .then((result) => ({ key, result }));
});

const storeResultsImpl = Promise.method((self, { keyPostfix, results, stringified }) => {
    const key = `${consts.KEY_PREFIX}/${moment.utc().format('YYYY-MM-DD')}/${keyPostfix}.json`;

    const readable = new Readable();
    readable._read = () => {}; // _read should be used to populate the stream, but we're pushing direct to it as we have the data in memory
    readable.push(stringified || JSON.stringify(results));
    readable.push(null);

    console.log('storeResultsImpl', self.thisBucket, key);
    return self.s3.upload(key, readable, 'AES256', self.thisBucket)
        .then((result) => ({ key, result }));
});

module.exports = BlobStorage;
