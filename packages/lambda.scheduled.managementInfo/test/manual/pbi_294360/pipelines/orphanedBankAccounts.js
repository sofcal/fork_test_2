/* eslint-disable */
var count = false;

// copy of pipeline from db/pipelines/orphanedBankAccounts.js as cannot use require in Mongo shell
var pipeline = [
    // with no $match stage, our results will contain all bank accounts in the database
    // so now we attempt to find the organisation for each of them

    // lookups for Organisation and OrganisationExt (return arrays)
    { $lookup: { from: 'Organisation', localField: 'organisationId', foreignField: '_id', as: 'orgLookup' } },
    { $lookup: { from: 'OrganisationExt', localField: 'organisationId', foreignField: '_id', as: 'orgExtLookup' } },

    // Join arrays
    { $project: {
        data: {
            _id: '$_id',
            bankId: '$bankId',
            organisationId: '$organisationId',
            status: '$status',
            lastTransactionId: '$lastTransactionId',
            lastHeldTransactionId: '$lastHeldTransactionId',
            aggregatorName: '$aggregatorName',
            accountant: '$accountant',
        },

        Union: { $concatArrays: ['$orgLookup', '$orgExtLookup'] }
    } },

    // Unwind the union collection into a result set.
    { $unwind: { path: '$Union', preserveNullAndEmptyArrays: true } },

    // Use Group to remove duplicate ids
    { $group: {
        _id: '$data',
        // Get first Organisation record
        organisationLookup: { $first: '$Union' }
    } },

    // now we can project to filter off information we don't want
    {
        $project: {
            _id: '$_id._id',
            bankId: '$_id.bankId',
            organisationId: '$_id.organisationId',
            status: '$_id.status',
            transactionCount: '$_id.lastTransactionId',
            unresolvedCount: '$_id.lastHeldTransactionId',
            aggregatorName: '$_id.aggregatorName',
            accountantManaged: '$_id.accountant.accountantManaged',
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
    },

    { $sort: { _id: 1 } }

    // we would now have a document for each bank account with no organisation in this region. It will have some
    // general summary information from the bank account and bank
];

if (count) {
    pipeline.push({ $group: { _id: null, count: { $sum: 1 } } });
}

var test = db.getCollection('BankAccount').aggregate(pipeline);

// Print results
printjson( test.toArray() );
