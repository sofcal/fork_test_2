'use strict';

// project
const ErrorSpecs = require('../../ErrorSpecs');

// internal modules
const { StatusCodeError } = require('internal-status-code-error');

// external modules
const _ = require('underscore');

module.exports = ({ bankAccountIds } = {}) => {
    if (!bankAccountIds) {
        const spec = _.extend({ params: { bankAccountIds } }, ErrorSpecs.pipelines.invalidPropertiesTS);
        throw StatusCodeError.CreateFromSpecs([spec], spec.statusCode);
    }

    return [
        // find all the transactions for bank accounts specified in bankAccountIds
        { $match: { bankAccountId: { $in: bankAccountIds } } },
        // unwind to generate a document per transaction - this could get big, so allowDiskUse will almost certainly be needed
        { $unwind: { path: '$transactions', preserveNullAndEmptyArrays: true } },
        {
            // now group the transactions again, generating only summary information (this will be a very small document)
            // we multiply everything by 100 so we can avoid too many rounding errors (there will still be some)
            $group: {
                _id: '$bankAccountId',
                creditsTotalCount: { $sum: { $cond: [{ $gte: ['$transactions.transactionAmount', 0] }, 1, 0] } },
                creditsTotalValue: { $sum: { $cond: [{ $gte: ['$transactions.transactionAmount', 0] }, { $multiply: ['$transactions.transactionAmount', 100] }, 0] } },
                creditsMaxValue: { $max: { $cond: [{ $gte: ['$transactions.transactionAmount', 0] }, { $multiply: ['$transactions.transactionAmount', 100] }, 0] } },
                debitsTotalCount: { $sum: { $cond: [{ $lt: ['$transactions.transactionAmount', 0] }, 1, 0] } },
                debitsTotalValue: { $sum: { $cond: [{ $lt: ['$transactions.transactionAmount', 0] }, { $multiply: ['$transactions.transactionAmount', 100] }, 0] } },
                debitsMaxValue: { $min: { $cond: [{ $lt: ['$transactions.transactionAmount', 0] }, { $multiply: ['$transactions.transactionAmount', 100] }, 0] } },
                absoluteTotalCount: { $sum: 1 },
                absoluteTotalValue: { $sum: { $multiply: [{ $abs: '$transactions.transactionAmount' }, 100] } },
            }
        },
        {
            // another project stage will allow us to gather average values. Note, there is no round function, so we trunc
            // instead. Therefore these values are NOT guaranteed to be to the penny accurate
            $project: {
                _id: 1,
                creditsTotalCount: 1,
                creditsTotalValue: 1,
                creditsMaxValue: 1,
                creditsAverageValue: { $trunc: { $cond: [{ $eq: ['$creditsTotalCount', 0] }, '$creditsTotalCount', { $divide: ['$creditsTotalValue', '$creditsTotalCount'] }] } },
                debitsTotalCount: 1,
                debitsTotalValue: 1,
                debitsMaxValue: 1,
                debitsAverageValue: { $trunc: { $cond: [{ $eq: ['$debitsTotalCount', 0] }, '$debitsTotalCount', { $divide: ['$debitsTotalValue', '$debitsTotalCount'] }] } },
                absoluteTotalCount: 1,
                absoluteTotalValue: 1,
                absoluteAverageValue: { $trunc: { $cond: [{ $eq: ['$absoluteTotalCount', 0] }, '$absoluteTotalCount', { $divide: ['$absoluteTotalValue', '$absoluteTotalCount'] }] } }
            }
        }
    ];
};
