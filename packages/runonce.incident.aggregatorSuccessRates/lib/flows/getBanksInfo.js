const Promise = require('bluebird');
const _ = require('underscore');

module.exports.retrieve = Promise.method(({ data, task, countryCode, dbQueries, blob, event }, { logger }) => {
    const { aggregatorWhitelist } = event.parsed;
    return dbQueries.getBankInfo({ region: countryCode, aggregatorWhitelist, all: true }, { logger: event.logger })
        .then((resultsPerAggregator = []) => {
            data[task][countryCode] = {};
            _.each(aggregatorWhitelist, (aggregator) => {
                data[task][countryCode][aggregator] = _.find(resultsPerAggregator, (rpa) => rpa._id === aggregator) || {};
            });
        })
});
