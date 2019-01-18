'use strict';

// project
const validate = require('./validators');
const { DBQueries } = require('./db');
const { BlobStorage } = require('./blob');
const { Wildcards } = require('./flows');

// internal modules

// external modules
const Promise = require('bluebird');
const moment = require('moment');

module.exports.run = Promise.method((event, params, services) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });

    const { Environment: env, AWS_REGION: thisRegion, bucket: bucketName } = process.env;

    validate.event(event);

    const queries = new DBQueries({ db: services.db.getConnection() });
    const blob = new BlobStorage({ s3: services.s3, thisRegion, env, bucketName });

    const flows = {
        wildcards: new Wildcards(queries)
    };

    const debug = {
        logger: event.logger
    };

    return Promise.resolve(undefined)
        .then(() => {
            return flows.wildcards.run({ all: true }, debug)
                .then((results) => {
                    event.logger.info({ function: func, log: 'retrieved consecutive wildcard usages', params: { count: results.length } });
                    if (!results || !results.length) {
                        event.logger.info({ function: func, log: 'no results found', params: { count: (results || []).length } });
                        return undefined;
                    }

                    event.logger.error({ function: func, alert: 'NEEDS_INVESTIGATION' });
                    event.logger.error({ function: func, log: 'bankAccounts found having rules with consecutive wildcards; storing results in s3', params: { count: (results || []).length } });

                    const keyPostfix = `${BlobStorage.Postfixes.results}_${moment.utc().format('HH:mm:ss.SSS')}`;
                    return blob.storeResults({ keyPostfix, results }, debug);
                });
        })
        .then(() => {
            return { status: 'done' };
        });
});
