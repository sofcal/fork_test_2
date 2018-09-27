const S3 = require('internal-services-s3');

// create and return any services that you'll need in your impl.
//  NOTE: db service is created automatically in handler.js
module.exports = ({ /* env, region, */ params }) => {
    const { bucket } = process.env;

    return {
        s3: S3.Create({ bucket })
    };
};
