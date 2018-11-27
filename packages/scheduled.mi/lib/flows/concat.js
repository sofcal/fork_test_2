// project
const { ResultsSummary, ProductSummary, TransactionSummary } = require('../summaries');
const { BlobStorage } = require('../blob');

// external modules
const Promise = require('bluebird');
const _ = require('underscore');

module.exports = Promise.method((blob, regions, productInfos) => {
    // we're going to need the concatenated orphans collections for every product we process. So we grab that first and
    // keep it in memory throughout.
    return retrieveAndPrepareOrphans(blob, regions)
        .then((groupedOrphans) => {
            const results = new ResultsSummary();

            // for all other files (product files) we handle 1 product at a time and pull both region files for it, before
            //  appending orphaned accounts and updating the transactionSummary
            return Promise.each(productInfos, // eslint-disable-line function-paren-newline
                (productInfo) => {
                    console.log(`merging results for product: ${productInfo._id}`);
                    return retrieveAndPrepareProduct(blob, regions, productInfo)
                        .then((reducedProduct) => mergeProductAndOrphans(results, reducedProduct, groupedOrphans, productInfo))
                        .then(() => {
                            console.log('_______RESULTS.PRODUCTS.LENGTH', results.products.length);
                        })
                        .catch((err) => {
                            console.log(`error on concat for product: ${productInfo._id} - ${err.message}`);
                        });
                }) // eslint-disable-line function-paren-newline
                .then(() => summariseRemainingOrphans(results, groupedOrphans))
                .then(() => results);
        });
});

const mergeProductAndOrphans = Promise.method((results, reducedProduct, groupedOrphans, { _id: productId, name: productName }) => {
    const product = new ProductSummary({ productId, productName });

    _.each(reducedProduct.organisations, (org) => {
        const orphansForOrg = groupedOrphans[org._id] || [];

        _.each(orphansForOrg, (orphan) => {
            const foundOnOrg = _.find(org.bankAccounts, (bankAccount) => bankAccount._id === orphan._id);

            if (!foundOnOrg) {
                orphan.missingOnOrg = true; // eslint-disable-line no-param-reassign
                results.orphaned.bankAccounts.push(orphan);

                if (orphan.transactionSummary) {
                    results.orphaned.transactions.updateFrom(orphan.transactionSummary);
                }

                return undefined;
            }

            // update the bank account properties on the org for when we're doing our summaries a little later.
            // TODO: we could optimise this by adjusting the figures here, rather than in a separate phase?
            foundOnOrg.missing = false;
            foundOnOrg.status = orphan.status;
            foundOnOrg.bankId = orphan.bankId;
            foundOnOrg.bankName = orphan.bankName;
            foundOnOrg.aggregatorName = orphan.aggregatorName;
            foundOnOrg.accountantManaged = orphan.accountantManaged;

            if (!orphan.transactionSummary) {
                // the bank account exists, but there are no transactions. So we can skip the next part
                return undefined;
            }

            // now we need to update the transaction summary information, as we've found valid transaction values for
            //  a bank account that were not included in our original summaries

            reducedProduct.transactionSummary.updateFrom(orphan.transactionSummary);

            return undefined;
        });

        product.updateFrom(org);

        // delete the organisation entry from the orphans. So that we can loop through the orphans again later to find all accounts
        //  that have no matching organisations
        delete groupedOrphans[org._id]; // eslint-disable-line no-param-reassign

        return undefined;
    });

    product.transactions.updateFrom(reducedProduct.transactionSummary);
    product.transactions.updateAverages();
    results.products.push(product);
});

const summariseRemainingOrphans = (results, groupedOrphans) => {
    _.each(_.keys(groupedOrphans), (key) => {
        _.each(groupedOrphans[key], (orphan) => {
            orphan.missingOnOrg = false; // eslint-disable-line no-param-reassign
            results.orphaned.bankAccounts.push(orphan);

            if (orphan.transactionSummary) {
                results.orphaned.transactions.updateFrom(orphan.transactionSummary);
            }
        });
    });
};

const retrieveFiles = Promise.method((blob, regions, keyPostfix) => {
    return Promise.map(regions, // eslint-disable-line function-paren-newline
        (region) => {
            console.log(`attempting to retrieve file for region: ${region}`);
            return blob.getResults({ region, keyPostfix })
                .catch((err) => {
                    if (err.statusCode === 404) {
                        console.log(`file missing in region: ${region}`);
                    }

                    throw err; // something bad happened
                });
        }, { concurrency: regions.length }); // eslint-disable-line function-paren-newline
});

const retrieveAndPrepareOrphans = Promise.method((blob, regions) => {
    return retrieveFiles(blob, regions, BlobStorage.Postfixes.orphaned)
        .then((results) => {
            return _.chain(results).pluck('orphaned').flatten().groupBy('organisationId')
                .value();
        });
});

const retrieveAndPrepareProduct = Promise.method((blob, regions, { _id: productId, name: productName }) => {
    return retrieveFiles(blob, regions, productId)
        .then((results) => {
            const template = {
                productId, productName, organisations: [], transactionSummary: new TransactionSummary()
            };

            return _.reduce(results, (memo, result) => {
                memo.organisations.push(...result.organisations);
                memo.transactionSummary.updateFrom(result.transactionSummary);

                return memo;
            }, template);
        });
});