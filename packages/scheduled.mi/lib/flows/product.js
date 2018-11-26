// project
const { ProductIntermediarySummary } = require('../summaries');

// external modules
const Promise = require('bluebird');
const _ = require('underscore');

module.exports = Promise.method((queries, { _id: productId, name: productName }) => {
    const intermediary = new ProductIntermediarySummary({ productName, productId });

    return queries.organisationsCompaniesBankAccounts({ productId, all: true })
        .then((orgs) => {
            console.log('org count: ', orgs.length);
            return Promise.map(orgs, // eslint-disable-line function-paren-newline
                (org) => {
                    intermediary.organisations.push(org);

                    // pull all bank account ids.
                    const bankAccountIds = _.chain(org.bankAccounts).pluck('_id').compact().value();

                    if (!bankAccountIds.length) {
                        // no point making a db query if we have no bank accounts
                        return undefined;
                    }

                    return queries.transactionSummaries({ bankAccountIds, all: true })
                        .then((summaries) => {
                            // console.log('summary count: ', summaries.length);
                            _.each(summaries, (summary) => {
                                // unlike with orphaned accounts, we can total these all up straight away and reduce memory footprint
                                intermediary.transactionSummary.updateFrom(summary);
                            });
                        })
                        .catch((err) => {
                            console.log(err);
                            throw err;
                        });
                },
                { concurrency: 50 }); // eslint-disable-line function-paren-newline
        })
        .then(() => {
            console.log('finished pulling for bank accounts')
            intermediary.transactionSummary.updateAverages();
            console.log('calculated averages');
        })
        .then(() => intermediary);
});
