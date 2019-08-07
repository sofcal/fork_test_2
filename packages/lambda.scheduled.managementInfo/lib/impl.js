'use strict';

// project
const validate = require('./validators');
const { DBQueries } = require('./db');
const { BlobStorage } = require('./blob');
const { Orphans, Product, Concat, SitesNotSupported } = require('./flows');

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

    validate.event(event);

    const { orphans } = event;
    let { products, concat, sitesNotSupported } = event;

    const otherRegion = BlobStorage.getOtherRegion(thisRegion);

    const queries = new DBQueries({ db: services.db.getConnection() });
    const blob = new BlobStorage({ s3: services.s3, thisRegion, otherRegion, env, bucketName });

    const flows = {
        orphans: new Orphans(queries),
        product: new Product(queries),
        sitesNotSupported: new SitesNotSupported(queries),
        concat: new Concat(blob)
    };

    const debug = {
        logger: event.logger
    };

    return Promise.resolve(undefined)
        .then(() => {
            // ALL is used as a special keyword to specify the stage should run for ALL products. So we map the input
            //  to the expected array of products
            if (products !== consts.all && concat !== consts.all) {
                event.logger.info({ function: func, log: 'neither products nor concat require products pull. Skipping retrieval', params: { } });
                return undefined;
            }

            return queries.products({ all: true }, debug)
                .then((results) => {
                    event.logger.info({ function: func, log: 'retrieved all products', params: { count: results.length } });
                    const mapped = _.map(results, (result) => ({ _id: result._id, name: result.name }));

                    products = (products === consts.all) ? mapped : products;
                    concat = (concat === consts.all) ? mapped : concat;
                });
        })
        .then(() => {
            if (!orphans) {
                event.logger.info({ function: func, log: 'orphans not specified on event. Skipping orphans check.', params: { } });
                return undefined;
            }

            return flows.orphans.run(null, debug)
                .then((results) => {
                    event.logger.info({ function: func, log: 'retrieved orphan information.', params: { } });
                    return blob.storeResults({ keyPostfix: BlobStorage.Postfixes.orphaned, results }, debug);
                });
        })
        .then(() => {
            if (!products) {
                event.logger.info({ function: func, log: 'products not specified on event. Skipping data gather for products.', params: { } });
                return undefined;
            }

            // we run through these one at a time to ensure we don't overload the memory
            return Promise.each(products, // eslint-disable-line function-paren-newline
                (product) => {
                    event.logger.info({ function: func, log: 'gathering results for product', params: { productName: product.name, productId: product._id } });
                    return flows.product.run(product, debug)
                        .then((results) => {
                            event.logger.info({ function: func, log: 'retrieved product information.', params: { } });
                            return blob.storeResults({ keyPostfix: product._id, results }, debug);
                        });
                }); // eslint-disable-line function-paren-newline
        })
        .then(() => {
            if (!sitesNotSupported) {
                event.logger.info({ function: func, log: 'sitesNotSupported not specified on event. Skipping data gather for sites not supported.', params: { } });
                return undefined;
            }

            const keyPostfix = `${BlobStorage.Postfixes.siteNotSupported}_${product._id}`;

            // we run through these one at a time to ensure we don't overload the memory
            return Promise.each(products, // eslint-disable-line function-paren-newline
                (product) => {
                    event.logger.info({ function: func, log: 'gathering results for sites not supported', params: { productName: product.name, productId: product._id } });
                    return flows.sitesNotSupported.run(product, debug)
                        .then((results) => {
                            event.logger.info({ function: func, log: 'retrieved sites not supported information.', params: { } });
                            return blob.storeResults({ keyPostfix, results }, debug);
                        });
                }); // eslint-disable-line function-paren-newline
        })
        .then(() => {
            if (!concat) {
                event.logger.info({ function: func, log: 'concat flag not specified on event. Skipping data concatenation.', params: { } });
                return undefined;
            }

            const keyPostfix = `${BlobStorage.Postfixes.concatenated}_${moment.utc().format('hh:mm:ss.SSS')}`;
            return flows.concat.run({ regions: [thisRegion, otherRegion], productInfos: concat }, debug)
                .then((results) => {
                    event.logger.info({ function: func, log: 'successfully concatenated all data; storing.', params: { } });
                    return blob.storeResults({ keyPostfix, results }, debug);
                });
        })
        .then(() => {
            return { status: 'done' };
        });
});
