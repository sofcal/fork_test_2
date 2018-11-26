'use strict';

// project
const ErrorSpecs = require('../../ErrorSpecs');

// internal modules
const { StatusCodeError } = require('internal-status-code-error');

// external modules
const _ = require('underscore');

module.exports = ({ bankAccountId } = {}) => {
    if (!bankAccountId) {
        const spec = _.extend({ params: { bankAccountId } }, ErrorSpecs.pipelines.invalidPropertiesTS);
        throw StatusCodeError.CreateFromSpecs([spec], spec.statusCode);
    }

    return [
        { $match: { bankAccountId } },
        { $unwind: { path: '$transactions', preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: '$bankAccountId',
                creditsTotalCount: { $sum: { $cond: [{ $gte: ['$transactions.transactionAmount', 0] }, 1, 0] } },
                creditsTotalValue: { $sum: { $cond: [{ $gte: ['$transactions.transactionAmount', 0] }, '$transactions.transactionAmount', 0] } },
                creditsMaxValue: { $max: { $cond: [{ $gte: ['$transactions.transactionAmount', 0] }, '$transactions.transactionAmount', 0] } },
                debitsTotalCount: { $sum: { $cond: [{ $lt: ['$transactions.transactionAmount', 0] }, 1, 0] } },
                debitsTotalValue: { $sum: { $cond: [{ $lt: ['$transactions.transactionAmount', 0] }, '$transactions.transactionAmount', 0] } },
                debitsMaxValue: { $min: { $cond: [{ $lt: ['$transactions.transactionAmount', 0] }, '$transactions.transactionAmount', 0] } },
                absoluteTotalCount: { $sum: 1 },
                absoluteTotalValue: { $sum: { $abs: '$transactions.transactionAmount' } },
            }
        },
        {
            $project: {
                _id: 1,
                creditsTotalCount: 1,
                creditsTotalValue: 1,
                creditsMaxValue: 1,
                creditsAverageValue: { $cond: [{ $eq: ['$creditsTotalCount', 0] }, '$creditsTotalCount', { $divide: ['$creditsTotalValue', '$creditsTotalCount'] }] },
                debitsTotalCount: 1,
                debitsTotalValue: 1,
                debitsMaxValue: 1,
                debitsAverageValue: { $cond: [{ $eq: ['$debitsTotalCount', 0] }, '$debitsTotalCount', { $divide: ['$debitsTotalValue', '$debitsTotalCount'] }] },
                absoluteTotalCount: 1,
                absoluteTotalValue: 1,
                absoluteAverageValue: { $cond: [{ $eq: ['$absoluteTotalCount', 0] }, '$absoluteTotalCount', { $divide: ['$absoluteTotalValue', '$absoluteTotalCount'] }] }
            }
        }
    ];
};
