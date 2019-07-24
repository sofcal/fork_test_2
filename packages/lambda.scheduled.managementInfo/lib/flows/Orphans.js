// project
const { OrphansIntermediarySummary, TransactionSummary } = require('../summaries');
const ErrorSpecs = require('../ErrorSpecs');

// internal modules
const { StatusCodeError } = require('@sage/bc-statuscodeerror');

// external modules
const Promise = require('bluebird');
const _ = require('underscore');

class Orphans {
    constructor(queries) {
        this.queries = queries;
    }

    run(...args) {
        return runImpl(this, ...args);
    }
}

const runImpl = Promise.method((self, options, { logger }) => {
    const func = `${consts.LOG_PREFIX}.run`;
    logger.info({ function: func, log: 'started', params: { } });

    const intermediary = new OrphansIntermediarySummary();

    // our first query searches the database for bank account that do not have an organisation. This runs on a single region, so
    // these are likely accounts that are multi-region and the organisation will be found on the other region.
    logger.info({ function: func, log: 'retrieving orphaned bank accounts', params: { } });
    return self.queries.orphanedBankAccounts({ all: true }, { logger })
        .then((orphans) => {
            logger.info({ function: func, log: 'retrieving transactions for orphaned accounts', params: { count: orphans.length } });
            return Promise.map(orphans, // eslint-disable-line function-paren-newline
                (bankAccount) => {
                    // for each bank account we need to get summary information about it's transactions
                    return self.queries.transactionSummaries({ bankAccountIds: [bankAccount._id], all: true }, { logger })
                        .then((summaries) => {
                            // because we don't know yet if this account is actually linked, we can't total up
                            // the values and instead have to store them per bank account. This will then be resolved in
                            // the concat stage
                            bankAccount.transactionSummary = summaries.length ? new TransactionSummary(summaries[0]) : null; // eslint-disable-line no-param-reassign
                            intermediary.orphaned.push(bankAccount);
                        })
                        .catch((err) => {
                            // if this happens, we can't feasibly continue, as something is clearly broken
                            const spec = _.extend({ params: { error: logger.stringifiableError(err), rethrow: true } }, ErrorSpecs.flows.orphans.transactionFailure);
                            logger.error({ function: func, log: spec.message, params: spec.params });
                            throw StatusCodeError.CreateFromSpecs([spec], spec.statusCode);
                        });
                },
                // we set a concurrency limit to ensure we don't overload the DB or our connections limit
                { concurrency: 50 }); // eslint-disable-line function-paren-newline
        })
        .then(() => intermediary);
});

const consts = {
    LOG_PREFIX: Orphans.name
};

module.exports = Orphans;
