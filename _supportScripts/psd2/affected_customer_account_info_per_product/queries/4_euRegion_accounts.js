/* eslint-disable */

var bankAccountIds = [

];

var pipeline = (productId, skip, limit) => {
    return [
        { $match: { _id: { $in: bankAccountIds } } },
        { $lookup: { from: 'Bank', localField: 'bankAccountLookup.bankId', foreignField: '_id', as: 'bankLookup' } },
        { $lookup: { from: 'Rule', localField: '_id', foreignField: 'bankAccountId', as: 'ruleLookup' } },
        {
            $project: {
                // most the fields we're projecting we haven't touch yet, this phase really just deals with filtering out a lot
                // of information we don't want or neeed, and creating a proper summary entry for the bank account
                _id: 1,
                
                organisationId: '$organisationId',
                
                companyName: '$company.companyName',
                companyId: '$company.companyId',

                bankId: 1,
                bankName: { $arrayElemAt: ['$bankLookup.name', 0] },
                aggregatorId: { $arrayElemAt: ['$bankLookup.aggregatorId', 0] },
                aggregatorName: '$aggregatorName',
                
                bankAccountId: '$_id',
                accountType: 1,
                status: 1,
                internal: 1,
                dataProvider: 1,
                transactionCount: '$lastTransactionId',
                unresolvedCount: '$lastHeldTransactionId',

                ruleCount: { $cond: [{ $not: ['$ruleLookup'] }, 0, { $arrayElemAt: ['$ruleLookup.numberOfRules', 0] }] },
                
                accountantManaged: '$accountant.accountantManaged',

                lastTransactionsReceived: 1,
                lastUpdatedByProvider: 1,
                lastTransactionsGet: 1
            }
        },
        { $sort: { organisationId: 1 } },
        { $skip: skip },
        { $limit: limit },
        { $group: { _id: 1, bankAccounts: { $addToSet: '$$ROOT' } } }
    ];
};

var sageFinancialsId = '35e1bc00-7183-408f-b363-a3a8eaeb2162';
var options = { allowDiskUse: true };


// Sage Financials / Sage Live
db.getCollection('BankAccount').aggregate(pipeline(sageFinancialsId, 0, 10000), options);
