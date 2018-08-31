'use strict';
const Promise = require('bluebird');
const _ = require('underscore');
const DB =  require('internal-services-db');
const mongodb = require('mongodb');

class FeedbackRuleGenerator {
    constructor(dbQueries, bankAccount) {  //todo: narrative dictionary
        this.dbQueries = dbQueries;
    }

    ProcessTransaction(...args) {
        return processTransactionImpl(this, ...args);
    }
}
const processTransactionImpl = Promise.method((self, notificationMsg) => {
    // Todo Verify transaction
});

// iterate and each at a time

module.exports = DbQueries;
