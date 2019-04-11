'use strict';

module.exports = ({ count = false, OrgCollection } = {}) => {
    const pipeline = [
        // with no $match stage, our results will contain all bank accounts in the database
        // so now we attempt to find the organisation for each of them
        { $lookup: { from: OrgCollection, localField: 'organisationId', foreignField: '_id', as: 'organisationLookup' } },
        // since lookup gives us back an array, we unwind to give us a document per organisation (though we know there'll
        // be one or none for each bank account)
        { $unwind: { path: '$organisationLookup', preserveNullAndEmptyArrays: true } },
        // now we can project to filter off information we don't want
        {
            $project: {
                _id: 1,
                bankId: 1,
                organisationId: 1,
                status: 1,
                transactionCount: '$lastTransactionId',
                unresolvedCount: '$lastHeldTransactionId',
                aggregatorName: 1,
                accountantManaged: '$accountant.accountantManaged',
                // we also add a missing flag, which tells us whether this bank account has an organisation in this db
                missing: { $cond: [{ $not: ['$organisationLookup'] }, true, false] }
            }
        },
        // we only care about the bank accounts with no organisation, so match on that
        { $match: { missing: true } },
        // we want the bank name, so lookup the bank document belonging to this bank account
        { $lookup: { from: 'Bank', localField: 'bankId', foreignField: '_id', as: 'bankLookup' } },
        {
            // finally, project the document again to extract the bank name
            $project: {
                _id: 1,
                organisationId: 1,
                status: 1,
                transactionCount: 1,
                unresolvedCount: 1,
                aggregatorName: 1,
                accountantManaged: 1,
                missing: 1,
                bankId: 1,
                bankName: { $cond: [{ $or: [{ $not: ['$bankLookup'] }, { $eq: ['$bankAccount', []] }] }, null, { $arrayElemAt: ['$bankLookup.name', 0] }] },
            }
        }

        // we would now have a document for each bank account with no organisation in this region. It will have some
        // general summary information from the bank account and bank
    ];

    if (count) {
        pipeline.push({ $group: { _id: null, count: { $sum: 1 } } });
    }

    return pipeline;
};
