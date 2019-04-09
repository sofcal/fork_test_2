'use strict';

const Promise = require('bluebird');

class DbQueries {
    constructor(db) {
        this.db = db;
    }

    getBankAccount(...args) {
        return getBankAccountImpl(this, ...args);
    }

    updateBankAccount(...args) {
        return updateBankAccountImpl(this, ...args);
    }

    updateTransactions(...args) {
        return updateTransactionsImpl(this, ...args);
    }
}

const getBankAccountImpl = Promise.method((self, bankAccountId) => {
    return self.db.collection('BankAccount').find({_id: bankAccountId});
});

const updateBankAccountImpl = Promise.method((self, bankAccount) => {
    return self.db.collection('BankAccount').update(
        {
            _id: bankAccount.uuid
        },
        {
            bankAuthorisationToken: bankAccount.bankAuthorisationToken,
            clientAuthorisationToken: bankAccount.clientAuthorisationToken,
            lastTransactionId: bankAccount.lastTransactionId,
            status: bankAccount.status,
            authAlwaysRequired: bankAccount.authAlwaysRequired
        },
        {
            upsert: true
        }
    );
});

const updateTransactionsImpl = Promise.method((self, buckets) => {
    return self.db.collection('Transaction').insertMany(buckets);
});

module.exports = DbQueries;
