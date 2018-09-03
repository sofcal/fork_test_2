'use strict';

const Promise = require('bluebird');
const validate = require('./validators');
const DbQueries = require('./DbQueries');
const FeedBackRuleGenerator = require('./FeedbackRuleGenerator');

module.exports.run = Promise.method((event, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });

    validate.event(event);

    const dbQueries = new DbQueries(services.db);
    const feedbackRuleGenerator = new FeedBackRuleGenerator(event.logger, dbQueries);

    const bankAccountId = event.Records[0].body.message.content.baId;
    const organisationid = event.Records[0].body.message.content.orgId;
    const transactionIds = _.map(event.records, (evtRec) => evtRec.body.message.content.trId);

    let successCount = 0;
    return dbQueries.getTransactions(bankAccountId, transactionIds).then((trasactions) => {
        return Promise.each(trasactions, (transaction) => {
            return feedbackRuleGenerator.ProcessTransaction(organisationid, bankAccountId, transaction).then(() => {
                successCount += 1;
            });
        });
    }).then(() => {
        event.logger.info({ function: func, log: 'ended' });
        return { processed: successCount };
    });
});
