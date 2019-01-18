'use strict';

const Promise = require('bluebird');
const validate = require('./validators');
const DbQueries = require('./dbQueries');
const _ = require('underscore');
const { BlobStorage } = require('./blob');

module.exports.run = Promise.method((event, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });
    const { env, region } = event;

    const debug = {
        logger: event.logger
    };



    validate.event(event);

    const dbQueries = new DbQueries(services.db.getConnection());

    event.logger.info({ function: func, log: 'Querying' });

    const accounts = { bankAccountIds: [] };
    const productId = process.env.ProductId;
    return dbQueries.getBankAccountsForProduct(productId)
        .then((result) => {
            event.logger.info({ function: func, log: `Querying for ${productId}` });

            _.each(result, (baDetails) => {
                // ignore delete BAs
                if (!baDetails.deleted) {
                    event.logger.info({ function: func, log: `BA: ${baDetails._id}` });
                    accounts.bankAccountIds.push(baDetails._id);
                }
            });

            // upload to s3
            const blob = new BlobStorage({ s3: services.s3, bucketName: process.env.bucket });
            return blob.storeResults({ keyPostfix: 'bankAccounts', productId, results: accounts }, debug);
        })
        .then(() => {
            return { accountsReturned: accounts.bankAccountIds.length };
        });
});
