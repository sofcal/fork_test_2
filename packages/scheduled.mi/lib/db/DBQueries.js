'use strict';

// project
const pipelines = require('./pipelines');

// internal modules

// external modules
const Promise = require('bluebird');

class DBQueries {
    constructor({ db }) {
        this.db = db;
        this.pipelines = pipelines;
    }

    organisationsCompaniesBankAccounts(...args) {
        return organisationsCompaniesBankAccountsImpl(this, ...args);
    }
    transactionSummaries(...args) {
        return transactionSummariesImpl(this, ...args);
    }
    orphanedBankAccounts(...args) {
        return orphanedBankAccountsImpl(this, ...args);
    }
}

const organisationsCompaniesBankAccountsImpl = Promise.method((self, { organisationId = null, productId = null, count = false , all = false } = {}) => {
    const collection = self.db.collection('Organisation');
    const pipeline = self.pipelines.organisationsCompaniesBankAccounts({ organisationId, productId, count });

    const promise = collection.aggregate(pipeline, { allowDiskUse: true });

    if (!all) {
        return promise;
    }

    return promise.toArray();
});

const transactionSummariesImpl = Promise.method((self, { unresolved = false, bankAccountId = null, all = false } = {}) => {
    const collection = self.db.collection(unresolved ? 'Unresolved' : 'Transaction');
    const pipeline = self.pipelines.transactionSummaries({ bankAccountId });

    const promise = collection.aggregate(pipeline, { allowDiskUse: true });

    if (!all) {
        return promise;
    }

    return promise.toArray();
});

const orphanedBankAccountsImpl = Promise.method((self, { all = false }) => {
    const collection = self.db.collection('BankAccount');
    const pipeline = self.pipelines.orphanedBankAccounts();

    const promise = collection.aggregate(pipeline, { allowDiskUse: true });

    if (!all) {
        return promise;
    }

    return promise.toArray();
});

module.exports = DBQueries;
