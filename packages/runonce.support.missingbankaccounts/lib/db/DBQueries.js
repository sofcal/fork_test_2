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
}

// const getBankAccountsByIdImpl = Promise.method((self, { bankAccountId, all = false }, { logger }) => {
//     const func = `${consts.LOG_PREFIX}.getBankAccountsById`;
//     logger.debug({ function: func, log: 'started', params: { all } });

//     const collection = self.db.collection('BankAccount');

//     const promise = collection.find({_id: bankAccountId}, consts.DEFAULT_OPTIONS);

//     if (!all) {
//         logger.debug({ function: func, log: 'ended - all not specified, returning cursor', params: { all } });
//         return promise;
//     }

//     logger.debug({ function: func, log: 'WARNING: requesting all results without a cursor could present a performance issue', params: { all } });
//     logger.debug({ function: func, log: 'ended - all specified; returning entire array', params: { all } });
//     return promise.toArray();
// });

const consts = {
    DEFAULT_OPTIONS: Object.freeze({ readPreference: 'secondary' }),
    LOG_PREFIX: DBQueries.name,
    MAX_BUCKET_SIZE: 100
};

module.exports = DBQueries;
