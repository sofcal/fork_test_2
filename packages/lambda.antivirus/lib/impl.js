'use strict';

const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const Promise = require('bluebird');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({signatureVersion: 'v4'});

const AntiVirusService = require('rtx.services.antivirus').AntivirusService;
const avResources = require('rtx.services.antivirus').resources;
const validate = require('./validators');

module.exports.run = Promise.method((event, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });

    validate.event(event);
    event.logger.info({ function: func, log: 'event', params: JSON.stringify(event) });

    const { Environment: env = 'test', AWS_REGION: region = 'local' } = process.env;
    const definitionBucket = params['antiVirus.definitionBucket'] || `bnkc-${env}-s3-${region}-app`;
    const definitionFiles = params['antiVirus.definitionFiles'] || ['main.cvd', 'daily.cvd', 'bytecode.cvd', 'mirrors.dat'];

    event.logger.info({ function: func, log: 'Definition details', params: {definitionBucket, definitionFiles}});

    const fileToCheck = path.basename(event.scanS3Key);
    const destinationFilePathToCheck = `/tmp/${fileToCheck}`;

    return Promise.resolve()
        .then(()=> {
            return downloadS3File(event.logger, event.scanS3Bucket, event.scanS3Key, destinationFilePathToCheck)
                .then(()=>{
                    return Promise.each(definitionFiles, (defFile) => downloadS3File(event.logger, definitionBucket, path.join('AntiVirusDefinitions', defFile), `/tmp/${defFile}`));
                })

        })
        .then(() => {
            event.logger.info({ function: func, log: 'AV Checking', params: {destinationFilePathToCheck}});
            const av = new AntiVirusService({}, event.logger);
            return av.scanFile(fileToCheck)
                .then((result) => {
                  return { avResponse: result};
                });
        })
        .catch((err) => {
            console.log('*** Error', err);
            event.logger.error({ function: func, alert: `Virus Scan Failed.`, error: err });
            return { avResponse: avResources.exitCodes.Error};
        });
});

const downloadS3File = Promise.method((logger, bucket, key, destinationFilePath) => {
    const func = 'impl.downloadS3File';
    logger.info({ function: func, log: `Downloading ${bucket}/${key} to ${destinationFilePath}` });
    const params = {Bucket: bucket, Key: key};
    return s3.getObject(params).promise()
        .then((response) => {
            const buffer = new Buffer(response.Body, 'base64');
            fs.writeFileSync(destinationFilePath, buffer);
            logger.info({ function: func, log: `Downloaded ${bucket}/${key} to ${destinationFilePath}` });
        })

});
