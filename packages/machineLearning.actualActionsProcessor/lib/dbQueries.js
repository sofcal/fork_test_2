'use strict';
const Promise = require('bluebird');
const _ = require('underscore');
const DB =  require('internal-services-db');
const mongodb = require('mongodb');
const Rule = require('internal-contracts-rule').Rule;
const RuleBucket = require('internal-contracts-rule').RuleBucket;
const uuid = require('uuid/v4');
const moment = require('moment');

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
    const query = {bankAccountId, organisationId };
    const update = { $set: { etag: moment.utc().valueOf() } };
    const options = {upsert: true, new: true};

    // create rule bucket if it doesn't exist
    return self.db.collection('Rule').findAndModify(query, null, update, options)
        .then((result) => {        
            let data = result.value;
            if (!data.rules) {
                data.rules = [];
                data.isAccountOwnerRules = false;
                data.numberOfRules = 0;
                data.region = 'GBR';
            }

            if (result.ok !== 1) {
                throw new Error('Failed to getRuleBucket:', query);
            }

            return result.value;
        });
});

const addFeedbackRuleImpl = Promise.method((self, organisationId, bankAccountId, rule) => {
    Rule.validate(rule);
    rule.uuid = uuid();

    return self.getRuleBucket(organisationId, bankAccountId, rule)
        .then((bucket) => {
            if (bucket.rules.length >= RuleBucket.MaxBucketSize ) { 
                throw new Error('Rule bucket full');
            }

            // check for a feedback rule that already exists

            buckets.Rules.push(rule);
            // todo: check for duplicate rule names 


            // set number of rules

            // todo: upsert 

            // throw if one record hasn't been updated

            // tests
    
        })
});

module.exports = DbQueries;