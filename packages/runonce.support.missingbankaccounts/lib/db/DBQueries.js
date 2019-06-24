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

    getBankAccountsByAccountDetails(...args) {
        return getBankAccountsByAccountDetailsImpl(this, ...args);
    }
}

const getBankAccountsByAccountDetailsImpl = Promise.method((self, bankAccountDetails) => {
    const collection = self.db.collection('BankAccount');
    const promise = collection.find({$or: bankAccountDetails}).project({accountIdentifier: 1, bankIdentifier: 1, _id: 0});
    return promise.toArray();
});

const consts = {
    DEFAULT_OPTIONS: Object.freeze({ readPreference: 'secondary' }),
    LOG_PREFIX: DBQueries.name,
    MAX_BUCKET_SIZE: 100
};

module.exports = DBQueries;
