'use strict';

const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const Promise = require('bluebird');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({signatureVersion: 'v4'});

const AntiVirusService = require('rtx.services.antivirus').AntivirusService;
const validate = require('./validators');

module.exports.run = Promise.method((event, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });
    const { env, region } = event;

    validate.event(event);

    const definitionBucket = 'bnkc-dev03-s3-eu-west-1-app'; // TODO: Resolve from Param Store
    const definitionFiles = ['main.cvd', 'daily.cvd', 'bytecode.cvd', 'mirrors.dat'];

    execSync('cp /var/task/bin/caf.pdf /tmp/caf.pdf', {stdio: 'inherit'});

    return Promise.resolve()
        .then(()=>{
            return Promise.each(definitionFiles, (defFile) => {
                const params = {Bucket: definitionBucket, Key: path.join('AntiVirusDefinitions', defFile)};
                return s3.getObject(params).promise()
                    .then((response) => {
                        const buffer = new Buffer(response.Body, 'base64');
                        const destinationFile = `/tmp/${defFile}`;
                        fs.writeFileSync(destinationFile, buffer);
                        event.logger.info({ function: func, log: `Download ${defFile} to ${destinationFile}` });
                    })
            });
        })
        .then(() => {
            const av = new AntiVirusService({}, event.logger);
            return av.scanFile('caf.pdf')
                .then((result) => {
                    console.log('result:'. result);


                    return av.scanFile('caf.pdf')
                        .then((result) => {
                            console.log('result:'. result);
                        })
                });
        })
        .catch((err) => {
            console.log('*** Error', err);
            event.logger.error({ function: func, alert: `Virus Scan Failed.`, error: err });
        });
});
