'use strict';

// project

// internal modules
const { Readable } = require('stream');

// external modules
const Promise = require('bluebird');
const moment = require('moment');

class BlobStorage {
    constructor({ s3, thisRegion, otherRegion, bucketName }) {
        this.s3 = s3;

        this.thisRegion = thisRegion;
        this.thisBucket = BlobStorage.getBucketName({ bucketName });
        this.otherBucket = BlobStorage.getBucketName({ thisRegion, otherRegion, bucketName });
    }

    getResults(...args) {
        return getResultsImpl(this, ...args);
    }

    retrieveFiles(...args) {
        return retrieveFilesImpl(this, ...args);
    }

    static getBucketName({ bucketName, thisRegion, otherRegion }) {
        const stripped = bucketName.replace('arn:aws:s3:::', '');

        if (thisRegion && otherRegion) {
            return stripped.replace(thisRegion, otherRegion);
        }

        return stripped;
    }

    static getOtherRegion(thisRegion) {
        return thisRegion === BlobStorage.Regions.usEast1 ? BlobStorage.Regions.euWest1 : BlobStorage.Regions.usEast1;
    }
}

BlobStorage.Postfixes = { orphaned: 'orphaned', concatenated: 'concatenated' };
BlobStorage.Regions = { euWest1: 'eu-west-1', usEast1: 'us-east-1' };

const retrieveFilesImpl = Promise.method((self, { productId, regions, keyPostfix }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.getResults`;
    logger.debug({ function: func, log: 'started', params: { productId, regions, keyPostfix } });

    return Promise.map(regions, // eslint-disable-line function-paren-newline
        (region) => {
            logger.debug({ function: func, log: 'attempting to retrieve file for region', params: { productId, region, keyPostfix } });
            return self.getResults({ productId, region, keyPostfix }, { logger })
                .catch((err) => {
                    if (err.statusCode === 404) {
                        logger.debug({ function: func, log: 'file missing in region', params: { productId, region, keyPostfix } });
                    }

                    throw err; // something bad happened
                });
        }, { concurrency: regions.length }) // eslint-disable-line function-paren-newline
        .then((ret) => {
            logger.debug({ function: func, log: 'ended', params: { regions, keyPostfix } });
            return ret;
        });
});

const getResultsImpl = Promise.method((self, { productId, keyPostfix, region }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.getResults`;
    logger.debug({ function: func, log: 'started' });

    const key = `${consts.KEY_PREFIX}/${productId}/${moment.utc().format('YYYY-MM-DD')}/${keyPostfix}.json`;
    const bucket = region === self.thisRegion ? self.thisBucket : self.otherBucket;

    logger.debug({ function: func, log: 'retrieving file from s3', params: { bucket, key } });
    return self.s3.get(key, bucket)
        .then((data) => {
            logger.debug({ function: func, log: 'file retrieved successfully', params: { bucket, key } });
            const json = data.Body.toString();
            return JSON.parse(json);
        })
        .catch((err) => {
            logger.debug({ function: func, log: 'error retrieving file from s3', params: { bucket, key, error: logger.stringifiableError(err), rethrow: true } });
            throw err;
        });
});

const consts = {
    KEY_PREFIX: 'bankaccounts',
    LOG_PREFIX: BlobStorage.name
};

module.exports = BlobStorage;
