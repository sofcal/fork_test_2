/* eslint-disable */

var pipeline = (productId, skip, limit) => {
    return [
        { $match: { 'products.productId': productId } },
        // remove properties that we don't care about using a project
        {
            $project: {
                _id: 1,
                type: 1,
                adminEmail: 1,
                crmId: 1,
                bankAccountCount: { $size: '$bankAccounts' },
                bankAccounts: 1,
                companyCount: { $size: '$companies' },
                companies: 1,
                productId: { $literal: productId }
            }
        },
        { $lookup: { from: 'Product', localField: 'productId', foreignField: '_id', as: 'productLookup' } },
        // unwind the bankAccounts array to give us a single document for each bank account
        { $unwind: { path: '$bankAccounts', preserveNullAndEmptyArrays: true } },
        // use the lookup stage and for each document, retrieve the bank account specified by the bankAccountId
        { $lookup: { from: 'BankAccount', localField: 'bankAccounts.bankAccountId', foreignField: '_id', as: 'bankAccountLookup' } },
        // since lookup gives us an array of results (even though we know there's only one for each, we unwind again to turn bankAccountLookup into an object
        { $unwind: { path: '$bankAccountLookup', preserveNullAndEmptyArrays: true } },
        // and now lookup the bank object too
        { $lookup: { from: 'Bank', localField: 'bankAccountLookup.bankId', foreignField: '_id', as: 'bankLookup' } },
        { $lookup: { from: 'Rule', localField: 'bankAccounts.bankAccountId', foreignField: 'bankAccountId', as: 'ruleLookup' } },
        {
            $project: {
                // most the fields we're projecting we haven't touch yet, this phase really just deals with filtering out a lot
                // of information we don't want or neeed, and creating a proper summary entry for the bank account
                _id: 1,
                
                productHeader: { $arrayElemAt: ['$productLookup.header', 0] },
                
                organisationId: '$_id',
                adminEmail: '$adminEmail',
                crmId: '$crmId',
                
                companyName: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.company.companyName'] },
                companyId: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.company.companyId'] },

                bankId: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.bankId'] },
                bankName: { $cond: [{ $not: ['$bankAccountLookup'] }, null, { $arrayElemAt: ['$bankLookup.name', 0] }] },
                aggregatorId: { $cond: [{ $not: ['$bankAccountLookup'] }, null, { $arrayElemAt: ['$bankLookup.aggregatorId', 0] }] },
                aggregatorName: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.aggregatorName'] },
                
                bankAccountId: '$bankAccounts.bankAccountId',
                region: 1,
                accountType: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.accountType'] },
                status: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.status'] },
                internal: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.internal'] },
                dataProvider: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.dataProvider'] },
                transactionCount: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.lastTransactionId'] },
                unresolvedCount: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.lastHeldTransactionId'] },
                
                accountantManaged: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.accountant.accountantManaged'] },

                ruleCount: { $cond: [{ $not: ['$ruleLookup'] }, 0, { $arrayElemAt: ['$ruleLookup.numberOfRules', 0] }] },

                lastTransactionsReceived: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.lastTransactionsReceived'] },
                lastUpdatedByProvider: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.lastUpdatedByProvider'] },
                lastTransactionsGet: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.lastTransactionsGet'] },

                // keeping track of the 'missing' bank accounts in a simple boolean field will help us in the code stages
                missing: { $cond: [{ $not: ['$bankAccountLookup'] }, true, false] },
                deleted: { $cond: [{ $not: ['$bankAccounts.deleted'] }, null, '$bankAccounts.deleted'] }
            }
        },
        { $match: { missing: true }},
        { $sort: { organisationId: 1 } },
        { $skip: skip },
        { $limit: limit },
        { $group: { _id: '$productHeader', bankAccounts: { $addToSet: '$$ROOT' } } }
    ];
}

var sageFinancialsId = '35e1bc00-7183-408f-b363-a3a8eaeb2162';
var options = { allowDiskUse: true };

// Sage Financials / Sage Live
db.getCollection('Organisation').aggregate(pipeline(sageFinancialsId, 0, 10000), options);
