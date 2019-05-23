'use strict';

const Promise = require('bluebird');
const _ = require('underscore');

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
    const promise = collection.replaceOne(where, bankAccount);

    logger.debug({ function: func, log: 'ended', params: { } });
    return promise;
});

const updateTransactionsImpl = Promise.method((self, { bankAccount, transactions }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.updateBankAccount`;
    logger.debug({ function: func, log: 'started', params: { } });

    const collection = self.db.collection('Transaction');
    const query = { bankAccountId: bankAccount._id, numberOfTransactions: { $lt: consts.MAX_BUCKET_SIZE } };

    const now = new Date();
    const nowString = now.toISOString();

    return collection.find(query).toArray()
        .then((buckets = []) => {
            let promise = Promise.resolve(undefined);

            if (buckets.length > 1) {
                logger.debug({ function: func, log: 'multiple unfilled buckets', params: { } });
                throw new Error('multiple unfilled buckets');
            } else if (buckets.length === 1) {
                const first = _.first(buckets);
                const toAdd = transactions.splice(0, consts.MAX_BUCKET_SIZE - first.numberOfTransactions);
                first.transactions.push(...toAdd);
                first.numberOfTransactions += toAdd.length;
                first.endIncrementedId = _.last(toAdd).incrementedId;
                first.endDate = nowString;

                promise = collection.replaceOne({ _id: first._id }, first);
            }

            const toInsert = _.chain(transactions)
                .groupBy((e, i) => Math.floor(i / consts.MAX_BUCKET_SIZE))
                .toArray()
                .map((b) => {
                    return {
                        bankAccountId: bankAccount._id,
                        startIncrementedId: b[0].incrementedId,
                        endIncrementedId: _.last(b).incrementedId,
                        startDate: nowString,
                        endDate: nowString,
                        numberOfTransactions: b.length,
                        region: bankAccount.region,
                        transactions: b
                    };
                })
                .value();

            return promise
                .then(() => {
                    if (!toInsert.length) {
                        return undefined;
                    }

                    return collection.insertMany(toInsert, { ordered: true });
                })
                .then(() => {
                    logger.debug({ function: func, log: 'ended', params: { } });
                })
        });
});


const consts = {
    DEFAULT_OPTIONS: Object.freeze({ readPreference: 'secondary' }),
    LOG_PREFIX: DBQueries.name,
    MAX_BUCKET_SIZE: 100
};

module.exports = DBQueries;
