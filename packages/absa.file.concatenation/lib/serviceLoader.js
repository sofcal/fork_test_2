const S3 = require('@sage/bc-services-s3');

// create and return any services that you'll need in your impl.
//  NOTE: db service is created automatically in handler.js
module.exports = {
    load: ({ /* env, region, params */ }) => {
        let { bucket } = process.env;
        bucket = bucket.replace('arn:aws:s3:::', '');

        return {
            s3: S3.Create({ bucket })
        };
    }
};
