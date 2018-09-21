'use strict';

const Promise = require('bluebird');
const _ = require('underscore');
const validate = require('./validators');
const DbQueries = require('./dbQueries');
const FeedBackRuleGenerator = require('./FeedbackRuleGenerator');

module.exports.run = Promise.method((event, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });

    validate.event(event);

    const dbQueries = new DbQueries(services.db.getConnection(), params);
    const feedbackRuleGenerator = new FeedBackRuleGenerator(event.logger, dbQueries);

    const notifications = _.map(event.Records, (evtRec) => {
        const body = JSON.parse(evtRec.body);
        return JSON.parse(body.Message);
    });

    event.logger.info({ function: func, log: `notifications: ${JSON.stringify(notifications)}` });

    let processed = 0;
    return Promise.each(notifications, // eslint-disable-line function-paren-newline
        (notification) => {
            return dbQueries.getTransactions(notification.baId, [notification.trId]).then((transactions) => {
                return Promise.each(transactions, (transaction) => {
                    return feedbackRuleGenerator.processTransaction(notification.orgId, notification.baId, transaction, notification.region).then(() => {
                        processed += 1;
                    });
                });
            });
        }) // eslint-disable-line function-paren-newline
        .then(() => {
            event.logger.info({function: func, log: 'ended'});
            return {msg: `processed ${notifications.length} of ${processed}`};
        });
});
