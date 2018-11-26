const S3 = require('internal-services-s3');

const { getBucketName } = require('./blob');

// create and return any services that you'll need in your impl.
//  NOTE: db service is created automatically in handler.js
module.exports = (/* { env, region, params } */) => {
    const { Environment: env, AWS_REGION: region, bucket: bucketName } = process.env;
    const bucket = getBucketName({ env, region, bucketName });

    return {
        s3: S3.Create({ bucket })
    };
};
