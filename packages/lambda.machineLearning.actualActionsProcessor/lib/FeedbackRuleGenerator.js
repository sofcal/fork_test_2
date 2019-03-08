'use strict';

const Promise = require('bluebird');
const { Rule } = require('@sage/bc-contracts-rule');
const NarrativeDictionaryContract = require('@sage/bc-contracts-narrativedictionary');

const narrativeDictionaryCache = {};

class FeedbackRuleGenerator {
    constructor(logger, dbQueries) {
        this.logger = logger;
        this.dbQueries = dbQueries;
    }

    processTransaction(...args) {
        return processTransactionImpl(this, ...args);
    }

    getNarrativeDictionary(...args) {
        return getNarrativeDictionaryImpl(this, ...args);
    }
}
const processTransactionImpl = Promise.method((self, orgId, baId, transaction, countryCode) => {
    const func = 'feedbackRuleGenerator.processTransactionImpl';
    self.logger.info({ function: func, log: 'started', params: { orgId, baId, transactionId: transaction.incrementedId, countryCode } });

    return Promise.resolve()
        .then(() => self.getNarrativeDictionary(countryCode))
        .then((narrativeDictionary) => {
            const match = narrativeDictionary.matches(transaction.transactionNarrative);

            if (match.matches.length > 0) {
                self.logger.info({ function: func, log: `'Match for: ${transaction.transactionNarrative}` });
                const newRule = Rule.createFromActualAction(transaction, match.longest);
                return self.dbQueries.addFeedbackRule(orgId, baId, newRule).then(() => self.logger.info({ function: func, log: 'ended' }));
            }

            self.logger.info({ function: func, log: `'No match for: ${transaction.transactionNarrative}` });
            self.logger.info({ function: func, log: 'ended' });
            return null;
        })
        .catch((err) => {
            if (err.failLambda) {
                self.logger.error({ function: func, log: 'Failing - Failed to process transaction', err: err.message });
                throw err;  // retry lamda sqs batch
            } else {
                // log and continue
                self.logger.error({ function: func, log: 'Continuing - Failed to process transaction', err: err.message });
            }
        });
});

const getNarrativeDictionaryImpl = Promise.method((self, countryCode) => {
    const func = 'feedbackRuleGenerator.getNarrativeDictionaryImpl';
    self.logger.info({ function: func, log: 'started', params: { countryCode } });
    let narrativeDictionary = narrativeDictionaryCache[countryCode];
    if (!narrativeDictionary) {
        return self.dbQueries.getNarrativeDictionary(countryCode).then((narrativeDictionaryDoc) => {
            if (!narrativeDictionaryDoc) {
                self.logger.info({ function: func, log: `unable to find a narrative dictionary for regions ${countryCode}.` });
                self.logger.info({ function: func, log: 'ended' });
                return null;
            }
            narrativeDictionary = new NarrativeDictionaryContract.NarrativeDictionary(JSON.parse(narrativeDictionaryDoc.data));
            narrativeDictionaryCache[countryCode] = narrativeDictionary;

            self.logger.info({ function: func, log: 'ended' });

            return narrativeDictionary;
        });
    }
    self.logger.info({ function: func, log: 'Narrative dictionary found in cache.' });
    return narrativeDictionary;
});

module.exports = FeedbackRuleGenerator;