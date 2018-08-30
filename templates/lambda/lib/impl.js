'use strict';

const Promise = require('bluebird');
const validate = require('./validators');

module.exports.run = Promise.method((event, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });

    const { env, region } = event;

    validate.event(event);

    return { value: 'sample body' };
});
