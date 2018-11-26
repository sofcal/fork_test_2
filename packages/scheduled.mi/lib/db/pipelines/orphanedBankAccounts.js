'use strict';

module.exports = ({ count = false } = {}) => {
    const pipeline = [
        { $match: { _id: { $in: ['e6b048b4-089a-404d-a1c1-88753ca38bcb', '72059d00-8fbf-43f5-8836-aa8d6df46432'] } } },
        { $lookup: { from: 'Organisation', localField: 'organisationId', foreignField: '_id', as: 'organisationLookup' } },
        { $unwind: { path: '$organisationLookup', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                bankId: 1,
                organisationId: 1,
                status: 1,
                aggregatorName: 1,
                accountantManaged: '$accountant.accountantManaged',
                missing: { $cond: [{ $not: ['$organisationLookup'] }, true, false] }
            }
        },
        { $match: { missing: true } },
        { $lookup: { from: 'Bank', localField: 'bankId', foreignField: '_id', as: 'bankLookup' } },
        {
            $project: {
                _id: 1,
                organisationId: 1,
                status: 1,
                aggregatorName: 1,
                accountantManaged: 1,
                missing: 1,
                bankId: 1,
                bankName: { $cond: [{ $or: [{ $not: ['$bankLookup'] }, { $eq: ['$bankAccount', []] }] }, null, { $arrayElemAt: ['$bankLookup.name', 0] }] },
            }
        },
        { $match: { bankName: { $ne: null } } }
    ];

    if (count) {
        pipeline.push({ $group: { _id: null, count: { $sum: 1 } } });
    }

    return pipeline;
};
