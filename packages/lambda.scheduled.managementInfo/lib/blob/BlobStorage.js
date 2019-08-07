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

    storeResults(...args) {
        return storeResultsImpl(this, ...args);
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

BlobStorage.Postfixes = { orphaned: 'orphaned', concatenated: 'concatenated', siteNotSupported: 'siteNotSupported' };
BlobStorage.Regions = { euWest1: 'eu-west-1', usEast1: 'us-east-1' };

const retrieveFilesImpl = Promise.method((self, { regions, keyPostfix }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.getResults`;
    logger.debug({ function: func, log: 'started', params: { regions, keyPostfix } });

    return Promise.map(regions, // eslint-disable-line function-paren-newline
        (region) => {
            logger.debug({ function: func, log: 'attempting to retrieve file for region', params: { region, keyPostfix } });
            return self.getResults({ region, keyPostfix }, { logger })
                .catch((err) => {
                    if (err.statusCode === 404) {
                        logger.debug({ function: func, log: 'file missing in region', params: { region, keyPostfix } });
                    }

                    throw err; // something bad happened
                });
        }, { concurrency: regions.length }) // eslint-disable-line function-paren-newline
        .then((ret) => {
            logger.debug({ function: func, log: 'ended', params: { regions, keyPostfix } });
            return ret;
        });
});

const getResultsImpl = Promise.method((self, { keyPostfix, region }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.getResults`;
    logger.debug({ function: func, log: 'started' });

    const key = `${consts.KEY_PREFIX}/${moment.utc().format('YYYY-MM-DD')}/${keyPostfix}.json`;
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

const storeResultsImpl = Promise.method((self, { keyPostfix, results, stringified }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.storeResults`;
    logger.debug({ function: func, log: 'started' });

    const key = `${consts.KEY_PREFIX}/${moment.utc().format('YYYY-MM-DD')}/${keyPostfix}.json`;
    const data = stringified || JSON.stringify(results);

    const readable = stringToBuffer(data);

    logger.debug({ function: func, log: 'uploading results to s3', params: { key, length: data.length } });
    return self.s3.upload(key, readable, 'AES256', self.thisBucket)
        .then((result) => {
            logger.debug({ function: func, log: 'file uploaded successfully', params: { key } });
            return { key, result };
        })
        .catch((err) => {
            logger.debug({ function: func, log: 'error uploading file to s3', params: { key, error: logger.stringifiableError(err), rethrow: true } });
            throw err;
        });
});

const stringToBuffer = (data) => {
    const readable = new Readable();
    readable._read = () => {}; // _read should be used to populate the stream, but we're pushing direct to it as we have the data in memory
    readable.push(data);
    readable.push(null);

    return readable;
};

const consts = {
    KEY_PREFIX: 'mi',
    LOG_PREFIX: BlobStorage.name
};

module.exports = BlobStorage;
