// project
const { ResultsSummary, ProductSummary, TransactionSummary } = require('../summaries');
const { BlobStorage } = require('../blob');
const ErrorSpecs = require('../ErrorSpecs');

// internal modules
const { StatusCodeError } = require('internal-status-code-error');

// external modules
const Promise = require('bluebird');
const _ = require('underscore');

class Concat {
    constructor(blob) {
        this.blob = blob;
    }

    run(...args) {
        return runImpl(this, ...args);
    }
}

const runImpl = Promise.method((self, { regions, productInfos }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.run`;
    logger.info({ function: func, log: 'started', params: { regions, productInfos } });

    // we're going to need the concatenated orphans collections for every product we process. So we grab that first and
    // keep it in memory throughout.
    return retrieveAndPrepareOrphans(self.blob, regions, logger)
        .catch((err) => {
            // we need the orphans files to create valid data for ANY product, so without it we can't continue processing
            const spec = _.extend({ params: { error: logger.stringifiableError(err), rethrow: true } }, ErrorSpecs.flows.concat.orphansFailure);
            logger.error({ function: func, log: spec.message, params: spec.params });
            throw StatusCodeError.CreateFromSpecs([spec], spec.statusCode);
        })
        .then((groupedOrphans) => {
            logger.info({ function: func, log: 'retrieved and merged orphans files', params: { } });
            const results = new ResultsSummary();

            // for all other files (product files) we handle 1 product at a time and pull both region files for it, before
            //  appending orphaned accounts and updating the transactionSummary
            return Promise.each(productInfos, // eslint-disable-line function-paren-newline
                (productInfo) => {
                    logger.info({ function: func, log: 'merging results for product', params: { productInfo } });
                    return retrieveAndPrepareProduct(self.blob, regions, productInfo, logger)
                        .then((reducedProduct) => mergeProductAndOrphans(results, reducedProduct, groupedOrphans, productInfo, logger))
                        .then(() => {
                            logger.info({ function: func, log: 'successfully merged results for product', params: { productInfo } });
                        })
                        .catch((err) => {
                            // we swallow this, as we can still retrieve results for other products, and don't want to block that
                            logger.error({ function: func, log: 'failed to merge results for product', params: { productInfo, error: logger.stringifiableError(err), rethrow: false } });
                        });
                }) // eslint-disable-line function-paren-newline
                .then(() => summariseRemainingOrphans(results, groupedOrphans, logger))
                .then(() => results.updateCSV())
                .then(() => {
                    logger.info({ function: func, log: 'ended', params: { regions, productInfos } });
                    return results;
                });
        });
});

const retrieveAndPrepareOrphans = Promise.method((blob, regions, logger) => {
    const func = `${consts.LOG_PREFIX}.retrieveAndPrepareOrphans`;
    logger.info({ function: func, log: 'started', params: { regions } });

    // pull orphan files for each region
    return blob.retrieveFiles({ regions, keyPostfix: BlobStorage.Postfixes.orphaned }, { logger })
        .then((results) => {
            // grouping the orphans by organisationId allows us to optimise our search later on. As we will be able to
            // index directly into the object for any given organisation, instead of searching an array. One loop here saves
            // many later.
            const ret = _.chain(results).pluck('orphaned').flatten().groupBy('organisationId')
                .value();

            logger.info({ function: func, log: 'ended', params: { regions } });
            return ret;
        });
});

const retrieveAndPrepareProduct = Promise.method((blob, regions, { _id: productId, name: productName }, logger) => {
    const func = `${consts.LOG_PREFIX}.retrieveAndPrepareProduct`;
    logger.info({ function: func, log: 'started', params: { regions, productId, productName } });

    // pull product files for each region
    return blob.retrieveFiles({ regions, keyPostfix: productId }, { logger })
        .then((results) => {
            // this is the initial memo object we're going to pass in. Allows us to avoid modifying any entry in the
            // array
            const initial = {
                productId, productName, organisations: [], transactionSummary: new TransactionSummary()
            };

            // reduce the results by concatenating the organisations array, and totalling up the transaction summary information
            const ret = _.reduce(results, (memo, result) => {
                memo.organisations.push(...result.organisations);
                memo.transactionSummary.updateFrom(result.transactionSummary);

                // memo will get passed to the next iteration
                return memo;
            }, initial);

            logger.info({ function: func, log: 'ended', params: { regions } });
            return ret;
        });
});

const mergeProductAndOrphans = Promise.method((results, reducedProduct, groupedOrphans, { _id: productId, name: productName }, logger) => {
    const func = `${consts.LOG_PREFIX}.mergeProductAndOrphans`;
    logger.info({ function: func, log: 'started', params: { productId, productName } });

    /**
     * NOTE: This is a tight loop, and so logging is kept to a minimum for performance reasons
     */

    const product = new ProductSummary({ productId, productName });

    // the goal here is to match up any 'missing' bankAccounts on any organisation, with the actual bank account found in
    // in the other region. Some of these missing accounts may not exist, and likewise, once we've finished all products,
    // there may still be some orphaned accounts
    _.each(reducedProduct.organisations, (org) => {
        // orphans are grouped by organisationId in the retrieveAndPrepareOrphans; which helps us here
        const orphansForOrg = groupedOrphans[org._id] || [];

        // now we search through the orphans for this org and see if any of them relate to a 'missing' account
        _.each(orphansForOrg, (orphan) => {
            const foundOnOrg = _.find(org.bankAccounts, (bankAccount) => bankAccount._id === orphan._id);

            if (!foundOnOrg) {
                // if the account isn't found on the organisation, then it's officially an orphan and we need to mark it
                // as such and keep track of it on our results
                orphan.missingOnOrg = true; // eslint-disable-line no-param-reassign
                results.orphaned.bankAccounts.push(orphan);

                if (orphan.transactionSummary) {
                    // if the orphan has transactions, we track that too
                    results.orphaned.transactions.updateFrom(orphan.transactionSummary);
                }

                // we don't want this showing up in the results output, as it's just noise
                delete orphan.transactionSummary; // eslint-disable-line no-param-reassign
                return undefined;
            }

            // update the bank account properties on the org for when we're doing our summaries a little later.
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

    // we can now update our totals and averages on the product. Remember, all totals/averages on product are zero or
    // unset to start with; so really we're 'setting' rather than 'updating'
    product.transactions.updateFrom(reducedProduct.transactionSummary);
    product.transactions.updateAverages();
    results.products.push(product);

    logger.info({ function: func, log: 'ended', params: { productId, productName } });
});

const summariseRemainingOrphans = (results, groupedOrphans, logger) => {
    const func = `${consts.LOG_PREFIX}.mergeProductAndOrphans`;
    logger.info({ function: func, log: 'started', params: { } });

    // now that each orphan has been checked against all the organisations, groupedOrphans should only contain
    // bank accounts for which an organisation doesn't exist - obviously, this shouldn't happen, but we track it
    // anyway.
    // result.orphaned will currently contain all bank accounts for which an organisation exists, but has no knowledge of
    // the bank account

    /**
     * NOTE: This is a tight loop, and so logging is kept to a minimum for performance reasons
     */

    _.each(_.keys(groupedOrphans), (key) => {
        _.each(groupedOrphans[key], (orphan) => {
            // this orphan isn't missing on the org, it's just missing an org full stop
            orphan.missingOnOrg = false; // eslint-disable-line no-param-reassign
            results.orphaned.bankAccounts.push(orphan);

            if (orphan.transactionSummary) {
                // again, if the orphan has a transaction summary, we track this too
                results.orphaned.transactions.updateFrom(orphan.transactionSummary);
            }

            // we don't want this showing up in the results output, as it's just noise
            delete orphan.transactionSummary; // eslint-disable-line no-param-reassign
        });
    });

    results.orphaned.transactions.updateAverages();
    logger.info({ function: func, log: 'ended', params: { } });
};

const consts = {
    LOG_PREFIX: Concat.name
};

module.exports = Concat;
