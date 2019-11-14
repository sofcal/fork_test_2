'use strict';

const Promise = require('bluebird');

class DBQueries {
    constructor(db) {
        this.db = db;
    }

    static Create(...args) {
        return new DBQueries(...args);
    }

    updateBankAccount(...args) {
        return updateBankAccountImpl(this, ...args);
    }
}

const updateBankAccountImpl = Promise.method((self, { bankAccount }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.updateBankAccount`;
    logger.debug({ function: func, log: 'started', params: { } });

    const collection = self.db.collection('BankAccount');
    const where = { _id: bankAccount._id };
    const promise = collection.updateOne(where, {$set: bankAccount});

    logger.debug({ function: func, log: 'ended', params: { } });
    return promise;
});

const consts = {
    LOG_PREFIX: DBQueries.name,
};

module.exports = DBQueries;
