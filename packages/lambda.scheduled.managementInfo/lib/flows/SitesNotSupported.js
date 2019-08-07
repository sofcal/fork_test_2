// project
const { SitesNotSupportedSummary } = require('../summaries');
const ErrorSpecs = require('../ErrorSpecs');

// internal modules
const { StatusCodeError } = require('@sage/bc-statuscodeerror');

// external modules
const Promise = require('bluebird');
const _ = require('underscore');

class SitesNotSupported {
    constructor(queries) {
        this.queries = queries;
    }

    run(...args) {
        return runImpl(this, ...args);
    }
}

const runImpl = Promise.method((self, { _id: productId, name: productName }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.run`;
    logger.info({ function: func, log: 'started', params: { } });

    const intermediary = new SitesNotSupportedSummary();

    logger.info({ function: func, log: 'retrieving bank accounts where site is not supported', params: { } });
    return self.queries.sitesNotSupported({ productId, count: false, all: true }, { logger })
        .then((sites) => {
            intermediary.sitesNotSupported.push(sites);
        })
        .then(() => intermediary)
        .catch((err) => {
            const spec = _.extend({ params: { productId, productName, error: logger.stringifiableError(err), rethrow: true } }, ErrorSpecs.flows.sitesNotSupported.sitesNotSupportedFailure);
            logger.error({ function: func, log: spec.message, params: spec.params });
            throw StatusCodeError.CreateFromSpecs([spec], spec.statusCode);
        });
});

const consts = {
    LOG_PREFIX: SitesNotSupportedSummary.name
};

module.exports = SitesNotSupported;
