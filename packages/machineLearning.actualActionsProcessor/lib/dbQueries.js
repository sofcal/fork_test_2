'use strict';

const Promise = require('bluebird');
const _ = require('underscore');
const { Rule, RuleBucket } = require('internal-contracts-rule');
const uuid = require('uuid/v4');
const moment = require('moment');
const access = require('safe-access');

class DbQueries {
    constructor(db, params) {
        this.db = db;
        this.params = params;
        this.maxNumberOfUserRules = parseInt(params['rules.maxNumberOfUserRules'], 10);
        this.maxNumberOfFeedbackRules = parseInt(params['rules.maxNumberOfFeedbackRules'], 10);
        this.maxNumberOfGlobalRules = parseInt(params['rules.maxNumberOfGlobalRules'], 10);
        this.maxBucketSize = this.maxNumberOfUserRules + this.maxNumberOfFeedbackRules + this.maxNumberOfGlobalRules;
    }

    getTransactions(...args) {
        return getTransactionsImpl(this, ...args);
    }

    getNarrativeDictionary(...args) {
        return getNarrativeDictionaryImpl(this, ...args);
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
                        result.push({ incrementedId: t.incrementedId, transactionAmount: t.transactionAmount, transactionNarrative: t.transactionNarrative, actualAction: t.actualAction });
                    }
                });
            });
        })
        .then(() => result);
});

const getNarrativeDictionaryImpl = Promise.method((self, countryCode) => {
    const where = { countryCode };

    return self.db.collection('NarrativeDictionary').find(where).toArray()
        .then((dictionaries) => {
            if (dictionaries.length > 1) {
                throw new Error(`More than one dictionary found for ${countryCode}`);
            }

            return dictionaries[0];
        });
});

const getRuleBucketImpl = Promise.method((self, organisationId, bankAccountId) => {
    const query = { bankAccountId, organisationId };
    const update = { $set: { etag: moment.utc().valueOf() } };
    const options = {upsert: true, new: true, writeConcern: { w : "majority"}};

    // create rule bucket if it doesn't exist
    return self.db.collection('Rule').findAndModify(query, null, update, options)
        .then((result) => {
            const data = result.value;
            if (!data.rules) {
                data.rules = [];
                data.isAccountOwnerRules = false;
                data.numberOfRules = 0;
                data.numberOfUserRules = 0;
                data.numberOfFeedbackRules = 0;
                data.numberOfGlobalRules = 0;
                data.region = ' ';
            }

            if (result.ok !== 1) {
                throw new Error('Failed to getRuleBucket:', query);
            }

            return result.value;
        });
});

const addFeedbackRuleImpl = Promise.method((self, organisationId, bankAccountId, newRule) => {
    Rule.validate(newRule);
    newRule.uuid = uuid(); // eslint-disable-line no-param-reassign
    newRule.ruleType = Rule.ruleTypes.feedback; // eslint-disable-line no-param-reassign

    return self.getRuleBucket(organisationId, bankAccountId, newRule)
        .then((bucket) => {
            if (bucket.rules.length >= self.maxBucketSize) {
                throw new Error('Rule bucket full');
            }
            if (bucket.numberOfFeedbackRules >= self.maxNumberOfFeedbackRules) {
                throw new Error('Feedback rules limit exceeded');
            }

            let ruleAlreadyExists = false;
            const newFeedbackRuleCriteria = access(newRule, 'ruleConditions[0].ruleCriteria');
            _.find(bucket.rules, (rule) => {
                if (rule.ruleType === Rule.ruleTypes.feedback) {
                    const exisitingRuleCriteria = access(rule, 'ruleConditions[0].ruleCriteria');
                    if (newFeedbackRuleCriteria === exisitingRuleCriteria) {
                        ruleAlreadyExists = true;
                    }
                }
            });

            if (ruleAlreadyExists) {
                return { skippedCreation: true };
            }

            bucket.rules = RuleBucket.addOrUpdateRuleByRank(bucket.rules, newRule); // eslint-disable-line no-param-reassign
            if (RuleBucket.checkForDuplicateRuleNames(bucket, true)) {
                return { skippedCreation: true };
            }

            bucket.numberOfRules += 1; // eslint-disable-line no-param-reassign
            bucket.numberOfFeedbackRules += 1; // eslint-disable-line no-param-reassign

            const query = { _id: bucket._id, etag: bucket.etag};
            const options = {upsert: false, writeConcern: { w : "majority"} };

            bucket.etag = moment.utc().valueOf();

            return self.db.collection('Rule').updateOne(query, { $set: bucket }, options);
        })
        .then((result) => {
            if ((!result.skippedCreation) && result.modifiedCount !== 1) {
                const retryErr = new Error('Failed to update rule bucket for new rule.');
                retryErr.failLambda = true;
                throw retryErr;
            }
        });
});

module.exports = DbQueries;
