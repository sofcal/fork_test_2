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
    self.logger.info({ function: func, log: 'started' });

    console.log('**Transaction:', JSON.stringify(transaction));

    const newRule = new Rule();
    newRule.ruleName = 'integrationTestRule1';
    newRule.targetType = 'Transaction';
    newRule.status = 'active';
    newRule.ruleConditions = [];
    newRule.ruleActions = [];

    return self.dbQueries.addFeedbackRule(orgId, paramId, newRule).then(() => {
        self.logger.info({ function: func, log: 'ended' });
    });
});

module.exports = FeedbackRuleGenerator;
