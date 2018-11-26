'use strict';

// project
const validate = require('./validators');
const { DBQueries } = require('./db');
const { BlobStorage } = require('./blob');

// internal modules

// external modules
const Promise = require('bluebird');
const Big = require('bignumber.js');

module.exports.run = Promise.method((event, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });

    const { Environment: env, AWS_REGION: region, bucket } = process.env;
    const { keyIn, keyOut } = event;

    validate.event(event);

    const queries = new DBQueries({ db: services.db.getConnection() });
    const blob = new BlobStorage({ s3: services.s3, thisRegion: region, otherRegion: 'us-east-1', env, bucketName: bucket });

    return Promise.resolve(undefined)
        .then(() => getOtherRegionResults(blob, keyIn))
        .then((otherRegionResults) => {
            return gatherRsults(queries)
                .then((thisRegionResults) => {
                    if (otherRegionResults) {
                        console.log('otherRegionResults', otherRegionResults)
                        return concatResults(thisRegionResults, otherRegionResults);
                    }

                    return thisRegionResults;
                });
        })
        .then((results) => storeResults(blob, keyOut, results))
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

const gatherRsults = (queries) => {
    const intermediary = {
        orphaned: [],
        organisations: [],
        transactionSummary: {
            creditsTotalCount: 0,
            creditsTotalValue: new Big(0),
            creditsMaxValue: 0,
            debitsTotalCount: 0,
            debitsTotalValue: new Big(0),
            debitsMaxValue: 0,
            absoluteTotalCount: 0,
            absoluteTotalValue: new Big(0),
            creditsAverageValue: null,
            debitsAverageValue: null,
            absoluteAverageValue: null
        }
    };

    console.log('about to start gathering');
    return Promise.resolve(undefined)
        .then(() => {
            console.log('pulling orphaned accounts');
            return queries.orphanedBankAccounts({ all: true })
                .then((orphans) => {
                    console.log('orphan count: ', orphans.length);
                    return Promise.map(orphans, // eslint-disable-line function-paren-newline
                        (bankAccount) => {
                            console.log('pulling transactions for orphan', bankAccount._id);
                            return queries.transactionSummaries({ bankAccountId: bankAccount._id, all: true })
                                .then((summary) => {
                                    // because we don't know yet if this account is actually linked, we can't total up
                                    //  the values and instead have to store them per bank account
                                    bankAccount.transactionSummary = summary; // eslint-disable-line no-param-reassign
                                    intermediary.orphaned.push(bankAccount);
                                });
                        },
                        { concurrency: 100 }); // eslint-disable-line function-paren-newline
                });
        })
        .then(() => {
            console.log('pulling org info');
            // loop through products
            return queries.organisationsCompaniesBankAccounts({ productId: '2ac2a370-6f73-4be4-b138-08eb9f2e7992', all: true })
                .then((orgs) => {
                    console.log('org count: ', orgs.length);
                    return Promise.map(orgs, // eslint-disable-line function-paren-newline
                        (org) => {
                            intermediary.organisations.push(org);

                            // using an each here so that the concurrency limit is managed entirely by the org map.
                            return Promise.each(org.bankAccounts, // eslint-disable-line function-paren-newline
                                (bankAccount) => {
                                    if (bankAccount.missing) {
                                        // bank account does not exist on this region, can't do anything with totals
                                        return undefined;
                                    }
                                    console.log('pulling summary for bank account', bankAccount._id);
                                    return queries.transactionSummaries({ bankAccountId: bankAccount._id, all: true })
                                        .then((summaries) => {
                                            if (summaries.length) {
                                                console.log('updating data');
                                                const [summary] = summaries;
                                                // unlike with orphaned accounts, we can total these all up straight away and reduce memory footprint
                                                intermediary.transactionSummary.creditsTotalCount += summary.creditsTotalCount;
                                                intermediary.transactionSummary.creditsTotalValue = intermediary.transactionSummary.creditsTotalValue.add(summary.creditsTotalValue);
                                                intermediary.transactionSummary.creditsMaxValue = Math.max(intermediary.transactionSummary.creditsMaxValue, summary.creditsMaxValue);

                                                intermediary.transactionSummary.debitsTotalCount += summary.debitsTotalCount;
                                                intermediary.transactionSummary.debitsTotalValue = intermediary.transactionSummary.debitsTotalValue.add(summary.debitsTotalValue);
                                                intermediary.transactionSummary.debitsMaxValue = Math.min(intermediary.transactionSummary.debitsMaxValue, summary.debitsMaxValue);

                                                intermediary.transactionSummary.absoluteTotalCount += summary.absoluteTotalCount;
                                                intermediary.transactionSummary.absoluteTotalValue = intermediary.transactionSummary.absoluteTotalValue.add(summary.absoluteTotalValue);
                                                console.log('update done');
                                            }
                                        });
                                }); // eslint-disable-line function-paren-newline
                        },
                        { concurrency: 100 }); // eslint-disable-line function-paren-newline
                });
        })
        .then(() => {
            intermediary.transactionSummary.creditsTotalValue = intermediary.transactionSummary.creditsTotalValue.toNumber();
            intermediary.transactionSummary.debitsTotalValue = intermediary.transactionSummary.debitsTotalValue.toNumber();
            intermediary.transactionSummary.absoluteTotalValue = intermediary.transactionSummary.absoluteTotalValue.toNumber();

            const average = (type) => {
                const value = intermediary.transactionSummary[`${type}TotalValue`];
                const count = intermediary.transactionSummary[`${type}TotalCount`];
                console.log('____value', value);
                console.log('____count', count);
                return new Big(value).div(count).round(2).toNumber();
            };

            intermediary.transactionSummary.creditsAverageValue = average('credits');
            intermediary.transactionSummary.debitsAverageValue = average('debits');
            intermediary.transactionSummary.absoluteAverageValue = average('absolute');
        })
        .then(() => {
            console.log(intermediary);
            return intermediary;
        });
};

const concatResults = (otherResults) => {
    const results = {
        orphaned: {
            bankAccounts: [
                // any bank accounts that don't have an associated organisation. If we're not in concat mode, it's still possible these accounts exist on the other region
            ],
            transactions: [
                // TODO what are we doing about unresolved?
                // transaction totals for bank accounts that don't have an associated organisation. Only present as a result of concat mode
            ]
        },
        products: [
            // object entry per product that contains the information seen in 'productTemplate'
        ]
    };

    return results;
};

const storeResults = (blob, keyOut, results) => {
    console.log('____WRITING DATA', keyOut);
    return blob.storeResults({ keyOverride: keyOut, results });
};

const productTemplate = () => {
    return {
        organisations: {
            total: 0,
            companiesAverage: 0,
            companiesMax: 0
        },
        companies: {
            total: 0,
            bankAccountsAverage: 0,
            bankAccountsMax: 0,
        },
        bankAccounts: {
            total: 0,
            statuses: {
                active: 0,
                pending: 0,
                cancelled: 0,
                inactiveFeed: 0,
                inactiveClient: 0,
            },
            accountantManaged: 0,
            transactionsAverage: 0,
            transactionsMax: 0
        },
        transactions: {
            credits: {
                totalCount: 0,
                totalValue: 0,
                averageValue: 0,
                maxValue: 0
            },
            debits: {
                totalCount: 0,
                totalValue: 0,
                averageValue: 0,
                maxValue: 0
            },
            absolute: {
                totalCount: 0,
                totalValue: 0,
                averageValue: 0
            }
        }
    };
};
