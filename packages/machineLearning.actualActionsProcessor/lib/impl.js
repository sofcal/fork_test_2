'use strict';

const Promise = require('bluebird');
const _ = require('underscore');
const validate = require('./validators');
const DbQueries = require('./DbQueries');
const FeedBackRuleGenerator = require('./FeedbackRuleGenerator');

module.exports.run = Promise.method((event, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });

    validate.event(event);

    const dbQueries = new DbQueries(services.db.getConnection());
    const feedbackRuleGenerator = new FeedBackRuleGenerator(event.logger, dbQueries);

    const notifications = _.map(event.Records, (evtRec) => {
        const body = JSON.parse(evtRec.body);
        return JSON.parse(body.Message);
    });
   
    event.logger.info({ function: func, log: `notifications: ${JSON.stringify(notifications)}` });
    const bankAccountId = notifications[0].baId;
    const organisationid = notifications[0].orgId;
    const transactionIds = _.map(notifications, (notification) => notification.trId);

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
