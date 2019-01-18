'use strict';

// project
const validate = require('./validators');
const { DBQueries } = require('./db');
const { BlobStorage } = require('./blob');
const { FeatureOptions } = require('./flows');

// internal modules

// external modules
const Promise = require('bluebird');
const _ = require('underscore');

module.exports.run = Promise.method((event, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });

    const { Environment: env, AWS_REGION: thisRegion, bucket: bucketName } = process.env;

    validate.event(event);

    const { featureOptions, wet, filePostfix = 'bankAccounts', productId } = event;

    const otherRegion = BlobStorage.getOtherRegion(thisRegion);

    const queries = new DBQueries({ db: services.db.getConnection() });
    const blob = new BlobStorage({ s3: services.s3, thisRegion, otherRegion, env, bucketName });

    const flows = {
        featureOptions: new FeatureOptions(blob, queries)
    };

    const debug = {
        logger: event.logger
    };

    return Promise.resolve(undefined)
        .then(() => {
            event.logger.info({ function: func, log: 'started featureOptions flow.', params: { } });
            return flows.featureOptions.run({ productId, filePostfix, regions: _.values(BlobStorage.Regions), featureOptions, wet }, debug)
                .then((results) => {
                    event.logger.info({ function: func, log: 'finished featureOptions flow.', params: { } });
                    return results;
                });
        })
        .then((results) => {
            return results;
        });
});
