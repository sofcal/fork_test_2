'use strict';

const Promise = require('bluebird');

class DbQueries {
    constructor(db) {
        this.db = db;
    }

    getBankAccountsForProduct(...args) {
        return getBankAccountsForProductImpl(this, ...args);
    }
}

const getBankAccountsForProductImpl = Promise.method((self, productId) => {
    const aggrQuery = [
        { $match: { 'products.productId': productId } },
        { $project: { bankAccounts: 1 } },
        { $unwind: { path: '$bankAccounts'}},
        { $project: {
            _id: '$bankAccounts.bankAccountId',
            deleted: { $cond: [{ $not: ['$bankAccounts.deleted'] }, null, '$bankAccounts.deleted'] }
        } }
    ];

    return self.db.collection('Organisation').aggregate(aggrQuery).toArray();
});

module.exports = DbQueries;
