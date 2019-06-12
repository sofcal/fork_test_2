'use strict';

const Promise = require('bluebird');
const validate = require('./validators');
const AntiVirusService = require('rtx.services.antivirus').AntivirusService;

module.exports.run = Promise.method((event, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });

    const defintionFiles = ['main.cvd', 'daily.cvd', 'bytecode.cvd', 'mirrors.dat'];
    const definitionBucket = 'bnkc-dev03-s3-eu-west-1-app';


    validate.event(event);
    const av = new AntiVirusService({}, event.logger);

    return av.updateDefinitions()
        .then((result) => {
            console.log('Result:', result);
        })
        .catch((err) => {
            console.log('ERR', err);
        });

});


