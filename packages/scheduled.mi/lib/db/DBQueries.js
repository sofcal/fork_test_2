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

const productsImpl = Promise.method((self, { all = false }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.products`;
    logger.debug({ function: func, log: 'started', params: { all } });

    const collection = self.db.collection('Product');

    const promise = collection.find({}, consts.DEFAULT_OPTIONS);

    if (!all) {
        logger.debug({ function: func, log: 'ended - all not specified, returning cursor', params: { all } });
        return promise;
    }

    logger.debug({ function: func, log: 'WARNING: requesting all results without a cursor could present a performance issue', params: { all } });
    logger.debug({ function: func, log: 'ended - all specified; returning entire array', params: { all } });
    return promise.toArray();
});

const organisationsCompaniesBankAccountsImpl = Promise.method((self, { organisationId = null, productId = null, count = false, all = false } = {}, { logger }) => {
    const func = `${consts.LOG_PREFIX}.organisationsCompaniesBankAccounts`;
    logger.debug({ function: func, log: 'started', params: { all, organisationId, productId, count } });

    const collection = self.db.collection('Organisation');
    const pipeline = self.pipelines.organisationsCompaniesBankAccounts({ organisationId, productId, count });

    const promise = collection.aggregate(pipeline, consts.DEFAULT_OPTIONS);

    if (!all) {
        logger.debug({ function: func, log: 'ended - all not specified, returning cursor', params: { all } });
        return promise;
    }

    logger.debug({ function: func, log: 'WARNING: requesting all results without a cursor could present a performance issue', params: { all } });
    logger.debug({ function: func, log: 'ended - all specified; returning entire array', params: { all } });
    return promise.toArray();
});

const transactionSummariesImpl = Promise.method((self, { unresolved = false, bankAccountIds = null, all = false } = {}, { logger }) => {
    const func = `${consts.LOG_PREFIX}.transactionSummaries`;
    logger.debug({ function: func, log: 'started', params: { all, unresolved, bankAccountIds } });

    const collection = self.db.collection(unresolved ? 'Unresolved' : 'Transaction');
    const pipeline = self.pipelines.transactionSummaries({ bankAccountIds });

    const promise = collection.aggregate(pipeline, consts.DEFAULT_OPTIONS);

    if (!all) {
        logger.debug({ function: func, log: 'ended - all not specified, returning cursor', params: { all } });
        return promise;
    }

    logger.debug({ function: func, log: 'WARNING: requesting all results without a cursor could present a performance issue', params: { all } });
    logger.debug({ function: func, log: 'ended - all specified; returning entire array', params: { all } });
    return promise.toArray();
});

const orphanedBankAccountsImpl = Promise.method((self, { all = false }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.orphanedBankAccounts`;
    logger.debug({ function: func, log: 'started', params: { all } });

    const collection = self.db.collection('BankAccount');
    const pipeline = self.pipelines.orphanedBankAccounts();

    const promise = collection.aggregate(pipeline, consts.DEFAULT_OPTIONS);

    if (!all) {
        logger.debug({ function: func, log: 'ended - all not specified, returning cursor', params: { all } });
        return promise;
    }

    logger.debug({ function: func, log: 'WARNING: requesting all results without a cursor could present a performance issue', params: { all } });
    logger.debug({ function: func, log: 'ended - all specified; returning entire array', params: { all } });
    return promise.toArray();
});

// consts
const consts = {
    DEFAULT_OPTIONS: Object.freeze({ allowDiskUse: true, readPreference: 'secondary' }),
    LOG_PREFIX: DBQueries.name
};

module.exports = DBQueries;
