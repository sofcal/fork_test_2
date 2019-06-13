'use strict';

const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const Promise = require('bluebird');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({signatureVersion: 'v4'});

const AntiVirusService = require('rtx.services.antivirus').AntivirusService;
const validate = require('./validators');

module.exports.run = Promise.method((event, context, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });

    validate.event(event);

    const definitionBucket = 'bnkc-dev03-s3-eu-west-1-app'; // TODO: Resolve from Param Store
    const definitionFiles = ['main.cvd', 'daily.cvd', 'bytecode.cvd', 'mirrors.dat'];

    return Promise.resolve()
        .then(() => {
            event.logger.info({ function: func, log: 'Boostrapping freshclam into /tmp' });
            execSync('/var/task/bin/freshClamBootstrap.sh', {stdio: 'inherit'});

            const av = new AntiVirusService({}, event.logger);
            return av.updateDefinitions();
        })
        .then((result) => {
            event.logger.info({ function: func, log: 'updateDefinition result', params: {result} });
            return Promise.each(definitionFiles, (defFile) => {
                let file = path.join('/tmp/', defFile);
                if (fs.existsSync(file)) {
                    event.logger.info({ function: func, log: `Existing file ${file}` });
                } else {
                    event.logger.error({ function: func, log: `Missing file ${file}` });
                }
            });
        })
        .then(() => {
            checkRemainingTime(event, context);
            return Promise.each(definitionFiles, (defFile) => {
                const file = path.join('/tmp/', defFile);
                const fileContents = fs.readFileSync(file);
                const params = {Bucket: definitionBucket, Key: path.join('AntiVirusDefinitions', defFile), Body: new Buffer(fileContents, 'binary')};
                return s3.putObject(params).promise()
                    .then(() => {
                        event.logger.info({ function: func, log: `Copied ${file} to ${params.Bucket}${params.Key}` });
                    })
            });
        })
        .catch((err) => {
            console.log('*** Error', err);
            event.logger.error({ function: func, alert: `Schedule Virus Definition Refresh Failed.`, error: err });
        });

});

const checkRemainingTime = (event, context) =>{
    // check we have more than enough time to copy all virus def files to s3
    const remaining = context.getRemainingTimeInMillis();
    event.logger.info({ function: 'checkRemainingTime', log: `Remaining time for S3 copy ${remaining}` });

    if (remaining < 60000) {
        throw new Error('Abort copy to S3.  Not enough time remaining.');
    }
}


