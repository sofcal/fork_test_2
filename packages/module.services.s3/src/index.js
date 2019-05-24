'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');

class S3 {
    constructor({ region, bucket, s3 }) {
        this.bucket = bucket;
        this._s3 = s3 || new AWS.S3({ region, params: { Bucket: bucket } });
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

    static Create(...args) {
        return new S3(...args);
    }
}

const uploadImpl = Promise.method((self, key, stream, encryption, bucket = self.bucket) => {
    const options = {
        Key: key, Body: stream, Bucket: bucket
    };

    if (encryption) {
        options.ServerSideEncryption = encryption;
    }

    return self._s3.upload(options).promise()
        .then((response) => response.Key);
});

const putImpl = Promise.method((self, key, buffer, encryption, bucket = self.bucket) => {
    const options = {
        Key: key, Body: buffer, Bucket: bucket
    };

    if (encryption) {
        options.ServerSideEncryption = encryption;
    }

    return self._s3.putObject(options).promise()
        .then((response) => response.VersionId);
});

const getImpl = Promise.method((self, key, bucket = self.bucket) => {
    const options = { Key: key, Bucket: bucket };

    return self._s3.getObject(options).promise()
        .then((data) => data);
});

// takes an overriden bucket id
const listImpl = Promise.method((self, bucket = self.bucket, prefix) => {
    const keys = [];
    const iterate = Promise.method((token) => {
        const options = { Bucket: bucket };

        if (prefix) {
            options.Prefix = prefix;
        }

        if (token) {
            options.ContinuationToken = token;
        }

        return self._s3.listObjectsV2(options).promise()
            .then((data) => {
                keys.push(...data.Contents);

                if (!data.IsTruncated) {
                    return undefined;
                }

                return iterate(data.NextContinuationToken);
            });
    });

    return iterate()
        .then(() => keys);
});

module.exports = S3;
