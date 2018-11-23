'use strict';

// project
const validate = require('./validators');
const { DBQueries } = require('./db');

// internal modules

// external modules
const Promise = require('bluebird');

module.exports.run = Promise.method((event, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });

    const { env, region } = event;

    validate.event(event);

    const queries = new DBQueries({ db: services.db.getConnection() });

    return queries.organisationsCompaniesBankAccounts({ productId: '2ac2a370-6f73-4be4-b138-08eb9f2e7992' })
        .then((orgs) => {
            console.log('orgs');
            console.log(orgs);

            return queries.transactionSummaries({ bankAccountId: '456abef4-01a3-4b86-a8b5-ba5bc9e20954' })
                .then((ts) => {
                    console.log('ts');
                    console.log(ts);

                    return queries.orphanedBankAccounts({ })
                        .then((o) => {
                            console.log('o');
                            console.log(o);

                            return { value: 'sample body' };
                        });
                });
        });
});
