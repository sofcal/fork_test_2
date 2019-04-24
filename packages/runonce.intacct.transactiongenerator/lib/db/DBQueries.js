'use strict';

const Promise = require('bluebird');

class DBQueries {
    constructor(db) {
        this.db = db;
    }

    static Create(...args) {
        return new DBQueries(...args);
    }

    getBankAccountsById(...args) {
        return getBankAccountsByIdImpl(this, ...args);
    }

    updateBankAccount(...args) {
        return updateBankAccountImpl(this, ...args);
    }

    updateTransactions(...args) {
        return updateTransactionsImpl(this, ...args);
    }
}

const getBankAccountsByIdImpl = Promise.method((self, { bankAccountId, all = false }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.getBankAccountsById`;
    logger.debug({ function: func, log: 'started', params: { all } });

    const collection = self.db.collection('BankAccount');

    const promise = collection.find({_id: bankAccountId}, consts.DEFAULT_OPTIONS);

    if (!all) {
        logger.debug({ function: func, log: 'ended - all not specified, returning cursor', params: { all } });
        return promise;
    }

    logger.debug({ function: func, log: 'WARNING: requesting all results without a cursor could present a performance issue', params: { all } });
    logger.debug({ function: func, log: 'ended - all specified; returning entire array', params: { all } });
    return promise.toArray();
});

const updateBankAccountImpl = Promise.method((self, { bankAccount }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.updateBankAccount`;
    logger.debug({ function: func, log: 'started', params: { } });

    const collection = self.db.collection('BankAccount');

    const where = { _id: bankAccount._id };
    const set = {
        bankAuthorisationToken: bankAccount.bankAuthorisationToken,
        clientAuthorisationToken: bankAccount.clientAuthorisationToken,
        lastTransactionId: bankAccount.lastTransactionId,
        status: bankAccount.status,
        authAlwaysRequired: bankAccount.authAlwaysRequired
    };
    const promise = collection.update(where, { $set: set });

    logger.debug({ function: func, log: 'ended', params: { } });
    return promise;
});

const updateTransactionsImpl = Promise.method((self, { buckets }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.updateBankAccount`;
    logger.debug({ function: func, log: 'started', params: { } });

    const collection = self.db.collection('Transaction');

    const promise = collection.insertMany(buckets);

    logger.debug({ function: func, log: 'ended', params: { } });
    return promise;
});

const consts = {
    DEFAULT_OPTIONS: Object.freeze({ readPreference: 'secondary' }),
    LOG_PREFIX: DBQueries.name
};

module.exports = DBQueries;
