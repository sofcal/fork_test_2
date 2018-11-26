'use strict';

// project
const validate = require('./validators');
const { DBQueries } = require('./db');
const { BlobStorage } = require('./blob');
const flows = require('./flows');

// internal modules

// external modules
const Promise = require('bluebird');
const _ = require('underscore');

module.exports.run = Promise.method((event, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });

    const { Environment: env, AWS_REGION: region, bucket } = process.env;
    const { products, concat, orphans } = event;

    validate.event(event);

    const queries = new DBQueries({ db: services.db.getConnection() });
    const blob = new BlobStorage({ s3: services.s3, thisRegion: region, otherRegion: 'us-east-1', env, bucketName: bucket });

    return Promise.resolve(undefined)
        .then(() => {
            if (!orphans) {
                console.log('orphans flag not specified on event. Skipping orphans check.');
                return undefined;
            }

            return flows.orphans(queries)
                .then((results) => storeResults(blob, 'orphaned', results));
        })
        .then(() => {
            if (!products) {
                console.log('products not specified on event. Skipping data gather for products.');
                return undefined;
            }

            // we run through these one at a time to ensure we don't overload the memory
            return Promise.each(products, // eslint-disable-line function-paren-newline
                (product) => {
                    console.log(`gathering results for product - name: ${product.name}; _id: ${product._id}`);
                    return flows.product(queries, product)
                        .then((results) => storeResults(blob, product._id, results));
                }); // eslint-disable-line function-paren-newline
        })
        .then(() => {
            if (!concat) {
                console.log('concat flag not specified on event. Skipping concatenation.');
                return undefined;
            }

            // return gatherResults(queries, productId)
            //     .then((thisRegionResults) => {
            //         if (otherRegionResults) {
            //             return concatResults(productId, thisRegionResults, otherRegionResults);
            //         }
            //
            //         return thisRegionResults;
            //     });
            // return storeResults(blob, 'concatenated', results);
        })
        .then(() => {
            return { status: 'done' };
        });
});


const getOtherRegionResults = (blob, keyIn) => {
    return blob.getResults({ other: true, keyIn })
        .catch((err) => {
            if (err.statusCode !== 404) {
                throw err; // something bad happened
            }

            // swallow, the file isn't there and that's fine. Means this is the first region to run
        });
};

const storeResults = (blob, keyPostfix, results) => {
    console.log('____WRITING DATA', keyPostfix);
    return blob.storeResults({ keyPostfix, results });
};

