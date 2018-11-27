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
const moment = require('moment');

const consts = {
    all: 'ALL'
};

module.exports.run = Promise.method((event, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });

    const { Environment: env, AWS_REGION: thisRegion, bucket: bucketName } = process.env;
    const { orphans } = event;
    let { products, concat } = event;

    validate.event(event);

    const otherRegion = BlobStorage.getOtherRegion(thisRegion);

    const queries = new DBQueries({ db: services.db.getConnection() });
    const blob = new BlobStorage({ s3: services.s3, thisRegion, otherRegion, env, bucketName });

    return Promise.resolve(undefined)
        .then(() => {
            // ALL is used as a special keyword to specify the stage should run for ALL products. So we map the input
            //  to the expected array of products
            if (products !== consts.all && concat !== consts.all) {
                return undefined;
            }

            return queries.products({ all: true })
                .then((results) => {
                    const mapped = _.map(results, (result) => ({ _id: result._id, name: result.name }));

                    products = (products === consts.all) ? mapped : products;
                    concat = (concat === consts.all) ? mapped : concat;
                });
        })
        .then(() => {
            if (!orphans) {
                console.log('orphans flag not specified on event. Skipping orphans check.');
                return undefined;
            }

            return flows.orphans(queries)
                .then((results) => storeResults(blob, BlobStorage.Postfixes.orphaned, results));
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

            const keyPostfix = `${BlobStorage.Postfixes.concatenated}_${moment.utc().format('hh:mm:ss.SSS')}`;
            return flows.concat(blob, [thisRegion, otherRegion], concat)
                .then((results) => storeResults(blob, keyPostfix, results));
        })
        .then(() => {
            return { status: 'done' };
        });
});

const storeResults = (blob, keyPostfix, results) => {
    console.log('____WRITING DATA', keyPostfix);
    return blob.storeResults({ keyPostfix, results });
};

