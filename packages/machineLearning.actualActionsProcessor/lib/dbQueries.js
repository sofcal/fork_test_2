'use strict';
const Promise = require('bluebird');
const _ = require('underscore');
const DB =  require('internal-services-db');
const mongodb = require('mongodb');
const Rule = require('internal-contracts-rule').Rule;
const RuleBucket = require('internal-contracts-rule').RuleBucket;
const uuid = require('uuid/v4');
const moment = require('moment');
const access = require('safe-access');

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
                data.region = ' ';
            }

            if (result.ok !== 1) {
                throw new Error('Failed to getRuleBucket:', query);
            }

            return result.value;
        });
});

// should it be called feedback rule - creation
const addFeedbackRuleImpl = Promise.method((self, organisationId, bankAccountId, newRule) => {
    Rule.validate(newRule);
    newRule.uuid = uuid();
    newRule.ruleType = Rule.ruleTypes.feedback;

    return self.getRuleBucket(organisationId, bankAccountId, newRule)
        .then((bucket) => {
            if (bucket.rules.length >= RuleBucket.MaxBucketSize) {
                throw new Error('Rule bucket full');
            }

            let ruleAlreadyExists = false;
            const newFeedbackRuleCriteria = access(newRule, 'ruleConditions[0]');
            _.find(bucket.rules, (rule) => {
                if (rule.ruleType === Rule.ruleTypes.feedback) {
                    const exisitingRuleCriteris = access(rules, 'ruleConditions[0]');
                    if (newFeedbackRuleCriteria === exisitingRuleCriteris) {
                        ruleAlreadyExists = true;
                    }
                }
            });

            if (ruleAlreadyExists) {
                return;
            }

            bucket.rules = RuleBucket.addOrUpdateRuleByRank(bucket.rules, newRule);
            RuleBucket.checkForDuplicateRuleNames(bucket);
            bucket.numberOfRules++;
          
            const query = { _id: bucket._id, etag: bucket.etag};
            const options = {upsert: false};

            return self.db.collection('Rule').updateOne(query, {$set: bucket},  options)
        })
        .then((result) => {       
            if (result.modifiedCount !== 1){
                throw new Error('Failed to update rule bucket for new rule.')
            } 
        })
});

module.exports = DbQueries;