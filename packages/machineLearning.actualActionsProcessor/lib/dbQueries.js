'use strict';
const Promise = require('bluebird');
const _ = require('underscore');
const DB =  require('internal-services-db');
const mongodb = require('mongodb');
const Rule = require('internal-contracts-rule').Rule;
const uuid = require('uuid/v4');

class DbQueries {
    constructor(db) {
        this.db = db;
    }

    getTransactions(...args) {
        return getTransactionsImpl(this, ...args);
    }

    addFeedbackRule(...args) {
        return addFeedbackRuleImpl(this, ...args);
    }

    getRuleBucket(...args) {
        return getRuleBucketImpl(this, ...args);
    }
}

const getTransactionsImpl = Promise.method((self, bankAccountId, transactionIds) => {
    const sorted = _.sortBy(transactionIds, (n) => n);
    const startId = _.first(sorted);
    const endId = _.last(sorted);
    const result = [];

    const where = { bankAccountId, startIncrementedId: { $lte: endId }, endIncrementedId: { $gte: startId } };
    
    return self.db.collection('Transaction').find(where).toArray()
        .then((buckets) => {
            return Promise.each(buckets, (bucket) => {
                _.each(bucket.transactions, (t) => {
                    if (_.contains(sorted, t.incrementedId)) {
                        result.push({incrementedId: t.incrementedId, transactionAmount: t.transactionAmount, actualAction: t.actualAction});
                    }
                });
            });
        })
        .then(() => result);
});

const getRuleBucketImpl = Promise.method((self, organisationId, bankAccountId) => {
    const where = { bankAccountId, organisationId };
    return self.db.collection('Rule').find(where).toArray()
        .then((buckets) => {
            if (buckets.length === 0) {
                // todo: return a new bucket
                return { todo : 'todo'};
            }

            if (buckets.length > 1) {
                throw new Error('expected to find at most one  bucket.  Found', buckets.length);
            }         
            return buckets[0];
        });
});

const addFeedbackRuleImpl = Promise.method((self, organisationId, bankAccountId, rule) => {

    console.log('*** Add a uuid:', uuid());

    Rule.validate(rule);
    rule.uuid = uuid();

    return self.getRuleBucket(organisationId, bankAccountId, rule)
        .then((bucket) => {
            if (bucket.rules.length >= 300 ) { // todo: off the rule bucket
                throw new Error('Rule bucket full');
            }

            // check for a feedback rule that already exists

            buckets.Rules.push(rule);

            // todo: maybe need to consider multiple bucket logic when size increases

            // todo: check for duplicate rule names 


            // set number of rules

            // todo: upsert 

            // throw if one record hasn't been updated

    
        })
});

module.exports = DbQueries;