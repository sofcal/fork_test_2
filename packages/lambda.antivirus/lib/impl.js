'use strict';

const Promise = require('bluebird');
const validate = require('./validators');
const AntiVirusService = require('rtx.services.antivirus').AntivirusService;

module.exports.run = Promise.method((event, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });
    const { env, region } = event;

    validate.event(event);

    const av = new AntiVirusService({}, event.logger);

    return av.scanFile('/var/task/package.json')
        .then((result) => {
            console.log('result:'. result);
        })
        .catch((err) => {
            consoel.log('err', err);
        })

/*
    event.logger.info({ function: func, log: 'ended' });
    return { value: 'sample body' };*/
});
