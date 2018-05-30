'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');

class S3 {
    constructor({ region, bucket }) {
        const s3 = new AWS.S3({
            region,
            params: { Bucket: bucket }
        });
        this._s3 = Promise.promisifyAll(s3);
    }

    put(...args) {
        return putImpl(this, ...args);
    }

    get(...args) {
        return getImpl(this, ...args);
    }

    list(...args) {
        return listImpl(this, ...args);
    }

    upload(...args) {
        return uploadImpl(this, ...args);
    }
}

const uploadImpl = Promise.method((self, key, stream, encryption) => {
    const options = {
        Key: key, Body: stream
    };

    if(encryption) {
        options.ServerSideEncryption = encryption;
    }

    return self._s3.uploadAsync(options)
        .then((response) => response.Key);
});

const putImpl = Promise.method((self, key, buffer, encryption) => {
    const options = {
        Key: key, Body: buffer
    };

    if(encryption) {
        options.ServerSideEncryption = encryption;
    }

    return self._s3.putObjectAsync(options)
        .then((response) => response.VersionId)
});

const getImpl = Promise.method((self, key) => {
    const options = {
        Key: key
    };

    return self._s3.getObjectAsync(options)
        .then((data) => data);
});

// takes an overriden bucket id
const listImpl = Promise.method((self, bucket) => {
    const keys = [];
    const iterate = Promise.method((token) => {
        const options = { Bucket: bucket };

        if (token) {
            options.ContinuationToken = token;
        }

        return self._s3.listObjectsV2Async(options)
            .then((data) => {
                keys.push(...data.Contents);

                if (data.IsTruncated) {
                    return iterate(data.NextContinuationToken);
                }
            })
    });

    return iterate()
        .then(() => keys)
});

module.exports = S3;
