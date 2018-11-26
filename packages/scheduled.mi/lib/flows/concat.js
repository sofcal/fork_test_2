// project
const { ResultsSummary, ProductSummary } = require('../summaries');

// external modules
const Promise = require('bluebird');
const _ = require('underscore');

module.exports = Promise.method((productId, thisRegionResults, otherRegionResults) => {
    const product = new ProductSummary();
    const results = new ResultsSummary({ products: [product] });

    console.log('____concatenating results from both regions');

    const checkOrphanedAccounts = (orgs, orphans, transactionSummary) => {
        // grouping the orphans will speed up our lookups, as we can now 'index' directly into an object instead of searching
        //  the entire collection for each organisationId
        const grouped = _.groupBy(orphans, 'organisationId');

        _.each(orgs, (org) => {
            const orphansForOrg = grouped[org._id];

            if (!orphansForOrg) {
                // there are no orphans for this organisation, so nothing to do
                return undefined;
            }

            _.each(orphansForOrg, (orphan) => {
                const foundOnOrg = _.find(org.bankAccounts, (bankAccount) => bankAccount._id === orphan._id);

                if (!foundOnOrg) {
                    orphan.missingOnOrg = true; // eslint-disable-line no-param-reassign
                    results.orphaned.bankAccounts.push(orphan);

                    if (orphan.transactionSummary) {
                        results.orphaned.transactions.update(orphan.transactionSummary);
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

                if (!foundOnOrg.transactionSummary) {
                    // the bank account exists, but there are no transactions. So we can skip the next part
                    return undefined;
                }

                // now we need to update the transaction summary information, as we've found valid transaction values for
                //  a bank account that were not included in our original summaries

                transactionSummary.updateFrom(foundOnOrg.transactionSummary);

                return undefined;
            });

            // delete the organisation entry from the orphans. So that we can loop through the orphans again later to find all accounts
            //  that have no matching organisations
            delete grouped[org._id];

            return undefined;
        });

        // return what's left in the grouped object, as these represent all orphaned bank accounts that do not have orgs in the other region
        return grouped;
    };

    const thisRegionRemainingOrphans = checkOrphanedAccounts(thisRegionResults.organisations, otherRegionResults.orphaned, thisRegionResults.transactionSummary);
    const otherRegionRemainingOrphans = checkOrphanedAccounts(otherRegionResults.organisations, thisRegionResults.orphaned, otherRegionResults.transactionSummary);

    const summariseRemainingOrphans = (groupedOrphans) => {
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

    summariseRemainingOrphans(thisRegionRemainingOrphans);
    summariseRemainingOrphans(otherRegionRemainingOrphans);

    // now we've summarised all the orphaned accounts, we need to concatenated the actual results for both regions. We've
    //  already updated the transactionSummary to include value results from the other region, so we just need to add them
    //  all up
    product.transactions.updateFrom(thisRegionResults.transactionSummary);
    product.transactions.updateFrom(otherRegionResults.transactionSummary);

    const summariseOrganisationResults = (prod, orgs) => {
        _.each(orgs, (org) => product.updateFrom(org));
    };

    summariseOrganisationResults(product, thisRegionResults.organisations);
    summariseOrganisationResults(product, otherRegionResults.organisations);

    return results;
});
