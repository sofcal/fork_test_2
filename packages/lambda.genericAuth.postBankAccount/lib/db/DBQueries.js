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
    logger.info({ function: func, log: 'started', params: { } });

    const collection = self.db.collection('BankAccount');
    const where = { _id: bankAccount._id };
    return collection.updateOne(where, {$set: bankAccount})
        .then((updateResult) => collection.findOne(where))
        .then((result) => {
            logger.info({ function: func, log: 'ended'});
            return result;
        })
});

const consts = {
    LOG_PREFIX: DBQueries.name,
};

module.exports = DBQueries;
