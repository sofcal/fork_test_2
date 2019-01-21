'use strict';

// project

// internal modules
const { Readable } = require('stream');

// external modules
const Promise = require('bluebird');
const moment = require('moment');

class BlobStorage {
    constructor({ s3, bucketName }) {
        this.s3 = s3;
        this.thisBucket = bucketName;
    }

    storeResults(...args) {
        return storeResultsImpl(this, ...args);
    }


    static getBucketName({ bucketName}) {
       return bucketName;
    }
}

const storeResultsImpl = Promise.method((self, { keyPostfix, productId, results, stringified }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.storeResults`;
    logger.debug({ function: func, log: 'started' });

    const key = `${consts.KEY_PREFIX}/${productId}/${moment.utc().format('YYYY-MM-DD')}/${keyPostfix}.json`;
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
    KEY_PREFIX: 'bankaccounts',
    LOG_PREFIX: BlobStorage.name
};

module.exports = BlobStorage;
