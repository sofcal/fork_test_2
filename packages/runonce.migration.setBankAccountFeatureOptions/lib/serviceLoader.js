const S3 = require('@sage/bc-services-s3');

const { BlobStorage } = require('./blob');

// create and return any services that you'll need in your impl.
//  NOTE: db service is created automatically in handler.js
module.exports = {
    load: (/* { env, region, params } */) => {
        const { bucket: bucketName } = process.env;
        const bucket = BlobStorage.getBucketName({ bucketName });

        return {
            s3: S3.Create({ bucket })
        };
    }
};
