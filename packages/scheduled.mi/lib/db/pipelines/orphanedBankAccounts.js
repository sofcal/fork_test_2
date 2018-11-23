'use strict';

module.exports = ({ count = false } = {}) => {
    const pipeline = [
        { $lookup: { from: 'Organisation', localField: 'organisationId', foreignField: '_id', as: 'organisationLookup' } },
        { $unwind: { path: '$organisationLookup', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, organisationId: 1, missing: { $cond: { if: { $eq: ['$organisationLookup', undefined] }, then: true, else: false } } } },
        { $match: { missing: true } },
    ];

    if (count) {
        pipeline.push({ $group: { _id: null, count: { $sum: 1 } } });
    }

    return pipeline;
};
