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
                lastTransactionsGet: { $dateToString: { format: '%Y-%m-%dT%H:%M:%S:%LZ', date: '$lastTransactionsGet' } },
                lastTransactionsReceived: { $dateToString: { format: '%Y-%m-%dT%H:%M:%S:%LZ', date: '$lastTransactionsReceived' } },
                lastTransactionId: 1,
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
                created: { $dateToString: { format: '%Y-%m-%dT%H:%M:%S:%LZ', date: '$created' } }
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
                        lastTransactionsGet: '$lastTransactionsGet',
                        lastTransactionsReceived: '$lastTransactionsReceived',
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
                        ruleCount: '$ruleLookup.numberOfRules'
                    }
                }
            }
        }
    ];
};

var options = { allowDiskUse: true };
db.getCollection('BankAccount').aggregate(pipeline(0, 25000), options);
db.getCollection('BankAccount').aggregate(pipeline(25000, 25000), options);
db.getCollection('BankAccount').aggregate(pipeline(50000, 25000), options);
db.getCollection('BankAccount').aggregate(pipeline(75000, 25000), options);
db.getCollection('BankAccount').aggregate(pipeline(100000, 25000), options);
db.getCollection('BankAccount').aggregate(pipeline(125000, 25000), options);
db.getCollection('BankAccount').aggregate(pipeline(150000, 25000), options);
db.getCollection('BankAccount').aggregate(pipeline(175000, 25000), options);
db.getCollection('BankAccount').aggregate(pipeline(200000, 25000), options);