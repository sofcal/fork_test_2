'use strict';

// project
const pipelines = require('./pipelines');

// internal modules

// external modules
const Promise = require('bluebird');

// consts
const consts = {
    DEFAULT_OPTIONS: Object.freeze({ allowDiskUse: true, readPreference: 'secondary' })
};

class DBQueries {
    constructor({ db }) {
        this.db = db;
        this.pipelines = pipelines;
    }

    products(...args) {
        return productsImpl(this, ...args);
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

const productsImpl = Promise.method((self, { all = false }) => {
    const collection = self.db.collection('Product');

    const promise = collection.find({}, consts.DEFAULT_OPTIONS);

    if (!all) {
        return promise;
    }

    return promise.toArray();
});

const organisationsCompaniesBankAccountsImpl = Promise.method((self, { organisationId = null, productId = null, count = false, all = false } = {}) => {
    const collection = self.db.collection('Organisation');
    const pipeline = self.pipelines.organisationsCompaniesBankAccounts({ organisationId, productId, count });

    const promise = collection.aggregate(pipeline, consts.DEFAULT_OPTIONS);

    if (!all) {
        return promise;
    }

    return promise.toArray();
});

const transactionSummariesImpl = Promise.method((self, { unresolved = false, bankAccountIds = null, all = false } = {}) => {
    const collection = self.db.collection(unresolved ? 'Unresolved' : 'Transaction');
    const pipeline = self.pipelines.transactionSummaries({ bankAccountIds });

    const promise = collection.aggregate(pipeline, consts.DEFAULT_OPTIONS);

    if (!all) {
        return promise;
    }

    return promise.toArray();
});

const orphanedBankAccountsImpl = Promise.method((self, { all = false }) => {
    const collection = self.db.collection('BankAccount');
    const pipeline = self.pipelines.orphanedBankAccounts();

    const promise = collection.aggregate(pipeline, consts.DEFAULT_OPTIONS);

    if (!all) {
        return promise;
    }

    return promise.toArray();
});

module.exports = DBQueries;
