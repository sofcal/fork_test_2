// project
const { OrphansIntermediarySummary } = require('../summaries');

// external modules
const Promise = require('bluebird');

module.exports = Promise.method((queries) => {
    const intermediary = new OrphansIntermediarySummary();

    console.log('pulling orphaned accounts');
    return queries.orphanedBankAccounts({ all: true })
        .then((orphans) => {
            console.log('pulling transactions for orphaned accounts');
            console.log('orphan count: ', orphans.length);
            return Promise.map(orphans, // eslint-disable-line function-paren-newline
                (bankAccount) => {
                    return queries.transactionSummaries({ bankAccountIds: [bankAccount._id], all: true })
                        .then((summaries) => {
                            // because we don't know yet if this account is actually linked, we can't total up
                            //  the values and instead have to store them per bank account
                            bankAccount.transactionSummary = summaries.length ? summaries[0] : null; // eslint-disable-line no-param-reassign
                            intermediary.orphaned.push(bankAccount);
                        })
                        .catch((err) => {
                            console.log(err);
                            throw err;
                        });
                },
                { concurrency: 50 }); // eslint-disable-line function-paren-newline
        })
        .then(() => intermediary);
});
