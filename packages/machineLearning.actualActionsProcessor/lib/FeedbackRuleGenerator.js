'use strict';

const Promise = require('bluebird');
const _ = require('underscore');
const Rule = require('internal-contracts-rule').Rule;

class FeedbackRuleGenerator {
    constructor(logger, dbQueries) {  //todo: narrative dictionary in on the constructor
        this.logger = logger;
        this.dbQueries = dbQueries;
    }

    ProcessTransaction(...args) {
        return processTransactionImpl(this, ...args);
    }
}
const processTransactionImpl = Promise.method((self, orgId, baId, transaction) => {
    const func = 'impl.run';
    self.logger.info({ function: func, log: 'started', params: { orgId, baId, transactionId: transaction.incrementedId } });

    return Promise.resolve()
        .then(() => {
            const newRule = Rule.createFromActualAction(transaction, transaction.transactionNarrative);
            return self.dbQueries.addFeedbackRule(orgId, baId, newRule).then(() => {
                self.logger.info({ function: func, log: 'ended' });
            });
        })
        .catch((err) => {
        
            self.logger.info({ function: func, log: 'Failed to process transaction', err });
        });
});

module.exports = FeedbackRuleGenerator;
