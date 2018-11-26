'use strict';

// project

// internal modules
const { Readable } = require('stream');
const getBucketName = require('./getBucketName');

// external modules
const Promise = require('bluebird');
const moment = require('moment');

class BlobStorage {
    constructor({ s3, thisRegion, otherRegion, env, bucketName }) {
        this.s3 = s3;

        this.thisRegion = thisRegion;
        this.otherRegion = otherRegion;

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

const getResultsImpl = Promise.method((self, { keyOverride, other = false }) => {
    const key = keyOverride || `${moment.utc().format('YYYY-MM-DD')}_${self.thisRegion}`;
    const bucket = other ? self.otherBucket : self.thisBucket;

    console.log('getResultsImpl', bucket, key);
    return self.s3.get(key, bucket)
        .then((result) => ({ key, result }));
});

const storeResultsImpl = Promise.method((self, { keyOverride, results }) => {
    const key = keyOverride || `${moment.utc().format('YYYY-MM-DD')}_${self.thisRegion}`;

    const readable = new Readable();
    readable._read = () => {}; // _read should be used to populate the stream, but we're pushing direct to it as we have the data in memory
    readable.push(JSON.stringify(results));
    readable.push(null);

    console.log('storeResultsImpl', self.thisBucket, key);
    return self.s3.upload(key, readable, 'AES256', self.thisBucket)
        .then((result) => ({ key, result }));
});

module.exports = BlobStorage;
