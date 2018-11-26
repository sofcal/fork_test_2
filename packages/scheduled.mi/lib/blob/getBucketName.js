'use strict';

module.exports = ({ env, region, bucketName }) => {
    return `bnkc-${env}-s3-${region}-${bucketName}`;
};
