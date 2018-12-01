// project
const { ProductIntermediarySummary, TransactionSummary } = require('../summaries');

// external modules
const Promise = require('bluebird');
const _ = require('underscore');

class Product {
    constructor(queries) {
        this.queries = queries;
    }

    run(...args) {
        return runImpl(this, ...args);
    }
}

const runImpl = Promise.method((queries, { _id: productId, name: productName }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.run`;
    logger.info({ function: func, log: 'started', params: { productId, productName } });

    const intermediary = new ProductIntermediarySummary({ productName, productId });

    logger.info({ function: func, log: 'retrieving organisations, companies and bank accounts for product', params: { productId, productName } });
    return queries.organisationsCompaniesBankAccounts({ productId, all: true })
        .then((orgs) => {
            logger.info({ function: func, log: 'successfully retrieved organisations, companies and bank accounts for product', params: { productId, productName, count: orgs.length } });

            /**
             * NOTE: This is a tight loop, and so logging is kept to a minimum for performance reasons
             */
            return Promise.map(orgs, // eslint-disable-line function-paren-newline
                (org) => {
                    intermediary.organisations.push(org);

                    // pull all bank account ids.
                    const bankAccountIds = _.chain(org.bankAccounts).pluck('_id').compact().value();

                    if (!bankAccountIds.length) {
                        // no point making a db query if we have no bank accounts
                        return undefined;
                    }

                    // get the transaction summaries for all bank accounts.
                    return queries.transactionSummaries({ bankAccountIds, all: true })
                        .then((summaries) => {
                            // console.log('summary count: ', summaries.length);
                            _.each(summaries, (summary) => {
                                // unlike with orphaned accounts, we can total these all up straight away and reduce memory footprint
                                intermediary.transactionSummary.updateFrom(new TransactionSummary(summary));
                            });
                        })
                        .catch((err) => {
                            logger.error({ function: func, log: 'failed to pull transaction summaries for one or more accounts. Processing cannot continue', params: { productId, productName, bankAccountIds, error: logger.stringifiableError(err), rethrow: true } });
                            throw err;
                        });
                },
                // we set a concurrency limit to ensure we don't overload the DB or our connections limit
                { concurrency: 50 }); // eslint-disable-line function-paren-newline
        })
        .then(() => {
            logger.info({ function: func, log: 'successfully retrieved transaction summaries for all accounts', params: { productId, productName } });
            intermediary.transactionSummary.updateAverages();
        })
        .then(() => {
            logger.info({ function: func, log: 'ended', params: { productId, productName } });
            return intermediary;
        });
});

const consts = {
    LOG_PREFIX: Product.name
};

module.exports = Product;
