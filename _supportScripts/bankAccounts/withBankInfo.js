var pipeline = (skip, limit) => {
    return [
        { $skip: skip },
        { $limit: limit },
        { $lookup: { from: 'Bank', localField: 'bankId', foreignField: '_id', as: 'bankLookup' } },
        { $unwind: { path: '$bankLookup', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                organisationId: 1,
                companyId: '$company.companyId',
                lastTransactionsGet: { $dateToString: { format: '%Y-%m-%dT%H:%M:%S:%LZ', date: '$lastTransactionsGet' } },
                lastTransactionsGetDate: { $dateToString: { format: '%Y-%m-%d', date: '$lastTransactionsGet' } },
                lastTransactionsReceived: { $dateToString: { format: '%Y-%m-%dT%H:%M:%S:%LZ', date: '$lastTransactionsReceived' } },
                lastTransactionsReceivedDate: { $dateToString: { format: '%Y-%m-%d', date: '$lastTransactionsReceived' } },
                lastTransactionId: 1,
                lastUnresolvedId: 1,
                accountantManaged: '$accountant.accountantManaged',
                accountType: 1,
                status: 1,
                statusReason: 1,
                region: 1,
                feedSource: 1,
                dataProvider: 1,
                bankId: '$bankLookup._id',
                bankName: '$bankLookup.name',
                bankStatus: '$bankLookup.status',
                bankCountry: '$bankLookup.primaryCountry',
                aggregatorName: '$bankLookup.aggregatorName',
                aggregatorId: '$bankLookup.aggregatorId',
                created: { $dateToString: { format: '%Y-%m-%dT%H:%M:%S:%LZ', date: '$created' } },
                createdDate: { $dateToString: { format: '%Y-%m-%d', date: '$created' } }
            }
        },
        { $lookup: { from: 'Rule', localField: '_id', foreignField: 'bankAccountId', as: 'ruleLookup' } },
        { $unwind: { path: '$ruleLookup', preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: 1,
                accounts: {
                    $addToSet: {
                        bankAccountId: '$_id',
                        organisationId: '$organisationId',
                        companyId: '$companyId',
                        lastTransactionsGet: '$lastTransactionsGet',
                        lastTransactionsGetDate: '$lastTransactionsGetDate',
                        lastTransactionsReceived: '$lastTransactionsReceived',
                        lastTransactionsReceivedDate: '$lastTransactionsReceivedDate',
                        lastTransactionId: '$lastTransactionId',
                        status: '$status',
                        statusReason: '$statusReason',
                        region: '$region',
                        feedSource: '$feedSource',
                        dataProvider: '$dataProvider',
                        bankId: '$bankId',
                        bankName: '$bankName',
                        bankStatus: '$bankStatus',
                        bankCountry: '$bankCountry',
                        aggregatorName: '$aggregatorName',
                        aggregatorId: '$aggregatorId',
                        created: '$created',
                        createdDate: '$createdDate',
                        ruleCount: '$ruleLookup.numberOfRules'
                    }
                }
            }
        }
    ];
};

var options = { allowDiskUse: true };

var pageSize = 25000;

var baCount = db.getCollection('BankAccount').count();
var baPages = Math.ceil(baCount / pageSize);

print('BA COUNT/BA_PAGES:', baCount, baPages);

var allBankAccounts = [];
for(let i = 0; i < baPages; ++i) {
    var result = db.getCollection('BankAccount').aggregate(pipeline(i * pageSize, pageSize), options).toArray();
    allBankAccounts.push(...result[0].accounts);
}

printjson({ accounts: allBankAccounts });
