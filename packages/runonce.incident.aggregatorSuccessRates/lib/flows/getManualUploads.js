const Promise = require('bluebird');
const _ = require('underscore');

module.exports.retrieve = Promise.method(({ data, task, countryCode, dbQueries, blob, event }, { logger }) => {
    const { startDate, emailBlacklist, aggregatorWhitelist } = event.parsed;
    return dbQueries.getManualUploadedCounts({ region: countryCode, startDate, emailBlacklist, aggregatorWhitelist, all: true }, { logger: event.logger })
        .then((resultsPerAggregator = []) => {
            data[task][countryCode] = {};
            _.each(aggregatorWhitelist, (aggregator) => {
                const { bankAccounts = [] } = _.find(resultsPerAggregator, (a) => a._id === aggregator) || {};
                data[task][countryCode][aggregator] = {
                    totalBankAccounts: bankAccounts.length,
                    totalOrganisations: _.uniq(bankAccounts, false, (ba) => ba.organisationId).length,
                    results: bankAccounts
                };
            });
        })
});
