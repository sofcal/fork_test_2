// project
const ErrorSpecs = require('../ErrorSpecs');

// internal modules
const { StatusCodeError } = require('internal-status-code-error');

// external modules
const Promise = require('bluebird');
const _ = require('underscore');

class FeatureOptions {
    constructor(blob, queries) {
        this.blob = blob;
        this.queries = queries;
    }

    run(...args) {
        return runImpl(this, ...args);
    }
}

const runImpl = Promise.method((self, { productId, filePostfix, regions, featureOptions = {}, wet = true }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.run`;
    logger.info({ function: func, log: 'started', params: { regions } });

    if (!productId || !_.isString(productId)) {
        const spec = ErrorSpecs.flows.featureOptions.invalidProductId;
        logger.error({ function: func, log: spec.message, params: { productId } });
        throw StatusCodeError.CreateFromSpecs([spec], spec.statusCode);
    }

    if (!filePostfix || !_.isString(filePostfix)) {
        const spec = ErrorSpecs.flows.featureOptions.invalidFilePostfix;
        logger.error({ function: func, log: spec.message, params: { filePostfix } });
        throw StatusCodeError.CreateFromSpecs([spec], spec.statusCode);
    }

    if (!_.keys(featureOptions).length) {
        const spec = ErrorSpecs.flows.featureOptions.invalidFeatureOptions;
        logger.error({ function: func, log: spec.message, params: { featureOptionsLength: _.keys(featureOptions).length } });
        throw StatusCodeError.CreateFromSpecs([spec], spec.statusCode);
    }

    const results = {
        successful: 0,
        notFound: 0,
        error: 0
    };

    return Promise.resolve(undefined)
        .then(() => {
            logger.info({ function: func, log: 'retrieving files from blob storage', params: { regions, filePostfix } });
            return self.blob.retrieveFiles({ regions, productId, keyPostfix: filePostfix }, { logger })
                .then((files) => {
                    const bankAccountIds = [];

                    _.each(files, (file) => {
                        bankAccountIds.push(...file.bankAccountIds);
                    });

                    logger.info({ function: func, log: 'merged bank account ids', params: { count: bankAccountIds.length } });
                    return bankAccountIds;
                });
        })
        .then((bankAccountIds) => {
            logger.info({ function: func, log: 'started updating bank accounts', params: { } });
            return Promise.map(bankAccountIds, // eslint-disable-line function-paren-newline
                (bankAccountId) => {
                    logger.debug({ function: func, log: 'updating bank account', params: { bankAccountId } });
                    if (!wet) {
                        // we don't modify the db on dry runs
                        logger.debug({ function: func, log: 'skipping db update for dry run', params: { bankAccountId } });
                        return undefined;
                    }

                    return self.queries.setFeatureOption({ bankAccountId, featureOptions }, { logger })
                        .then((found) => {
                            if (found) {
                                logger.debug({ function: func, log: 'bank account updated', params: { bankAccountId } });
                                results.successful += 1;
                            } else {
                                logger.debug({ function: func, log: 'bank account not found', params: { bankAccountId } });
                                results.notFound += 1;
                            }
                        })
                        .catch((err) => {
                            logger.error({ function: func, log: 'error attempting to update bank account', params: { bankAccountId, error: logger.stringifiableError(err) } });
                            results.error += 1;
                        });
                }, { concurrency: 50 }) // eslint-disable-line function-paren-newline
                .then(() => {
                    logger.info({ function: func, log: 'finished updating bank accounts', params: { } });
                })
                .then(() => {
                    logger.info({ function: func, log: 'ended', params: { successful: results.successful, notFound: results.notFound, error: results.error } });
                    return results;
                });
        });
});

const consts = {
    LOG_PREFIX: FeatureOptions.name
};

module.exports = FeatureOptions;
