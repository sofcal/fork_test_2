'use strict';

const validate = require('./validators');
const ErrorSpecs = require('./ErrorSpecs');
const { StatusCodeError } = require('internal-status-code-error');
const Promise = require('bluebird');
const moment = require('moment');
const _ = require('underscore');
const _s = require('underscore.string');

const concatenationId = '28ed18ca-72b0-4889-877a-3b4663c75876';

module.exports.run = Promise.method((event, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });

    let { bucket, fromPrefix, toPrefix } = validate.env(process.env);
    const { eventTargetDate } = validate.event(event);
    bucket = bucket.replace('arn:aws:s3:::', '');

    const startDate = eventTargetDate ? moment(eventTargetDate).startOf('day') : moment().subtract(1, 'days').startOf('day');
    const endDate = moment(startDate).endOf('day');

    event.logger.info({ function: func, log: 'details', bucket, fromPrefix, toPrefix, startDate: startDate.toISOString(), endDate: endDate.toISOString() });

    event.logger.info({ function: func, log: 'retrieving file list from s3' });
    return services.s3.list(bucket, fromPrefix)
        .then((items) => {
            // items includes the top level 'folder', which we don't want to report on.
            // eslint-disable-next-line no-param-reassign
            items = _.reject(items, (item) => item.Key === `${fromPrefix}/`);

            event.logger.info({ function: func, log: 'retrieved items from s3', count: items.length || 0 });
            const toProcess = [];

            event.logger.info({ function: func, log: 'filtering items by date' });
            _.each(items, (item) => {
                const lastModified = moment(item.LastModified);
                const inPeriod = startDate <= lastModified && lastModified <= endDate;
                if (!inPeriod) {
                    event.logger.info({ function: func, log: 'skipping file, date not in period', lastModified: item.LastModified });
                    return;
                }
                toProcess.push(item.Key);
            });

            if (!toProcess.length) {
                event.logger.error({ function: func, log: 'no data files to process for period', startDate: startDate.toISOString(), endDate: endDate.toISOString() });
                throw StatusCodeError.CreateFromSpecs([ErrorSpecs.noDataFilesToProcess], ErrorSpecs.noDataFilesToProcess.statusCode);
            }

            event.logger.info({ function: func, log: 'retrieving actual files from s3', toProcess: toProcess.length });
            return Promise.map(toProcess, // eslint-disable-line function-paren-newline
                (key) => {
                    return services.s3.get(key)
                        .then((result) => ({ key, result }));
                })// eslint-disable-line function-paren-newline
                .then((results) => {
                    event.logger.info({ function: func, log: 'retrieved actual files from s3', count: results.length });
                    return _.chain(results)
                        // we need to add the original filename to the account section
                        .map(({ key, result }) => `${_s.strRight(key, `${fromPrefix}/`)}\n${result.Body.toString()}`)
                        .value()
                        .join('\n');
                });
        })
        .then((concatenated) => {
            if (!concatenated.length) {
                event.logger.error({ function: func, log: 'no data to concatenate' });
                throw StatusCodeError.CreateFromSpecs([ErrorSpecs.noDataGenerated], ErrorSpecs.noDataGenerated.statusCode);
            }

            event.logger.info({ function: func, log: 'generated concatenated file' });
            const timestamp = new Date();
            const putDate = timestamp.toISOString();
            const header = `__${concatenationId}__CONCATENATED_FILE__${timestamp}`;

            let filename = `${toPrefix}/${putDate}-absa-statements.txt`;
            filename = filename.replace(/[:-]/g, '_');
            filename = filename.replace('.', ''); // only replace first

            event.logger.info({ function: func, log: 'uploading concatenated file to s3', bucket, filename });
            return services.s3.put(filename, Buffer.from(`${header}\n${concatenated}`), 'AES256')
                .then(() => filename);
        })
        .then((filename) => {
            event.logger.info({ function: func, log: 'ended' });
            return { filename };
        });
});
