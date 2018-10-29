'use strict';

const Promise = require('bluebird');
const validate = require('./validators');

class Impl {
    static run(event, params, services) {
        return Promise.method(() => {
            const func = 'impl.run';
            event.logger.info({ function: func, log: 'started' });

            const { env, region } = event;

            validate.event(event);

            return { value: 'sample body' };
        })
    }
}

module.exports.run = Impl.run;
