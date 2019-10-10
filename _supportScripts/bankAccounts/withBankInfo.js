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
        {
            $group: {
                _id: 1,
                accounts: {
                    $addToSet: {
                        bankAccountId: '$_id',
                        organisationId: '$organisationId',
                        lastTransactionsGet: '$lastTransactionsGet',
                        lastTransactionsReceived: '$lastTransactionsReceived',
                        status: '$status',
                        statusReason: '$statusReason',
                        region: '$region',
                        feedSource: '$feedSource',
                        dataProvider: '$organisationId',
                        bankId: '$bankId',
                        bankName: '$bankName',
                        bankStatus: '$bankStatus',
                        bankCountry: '$bankCountry',
                        aggregatorName: '$aggregatorName',
                        aggregatorId: '$aggregatorId',
                        created: '$created'
                    }
                }
            }
        }
    ];
};

var options = { allowDiskUse: true };
db.getCollection('BankAccount').aggregate(pipeline(0, 10000), options);
db.getCollection('BankAccount').aggregate(pipeline(10000, 10000), options);
db.getCollection('BankAccount').aggregate(pipeline(20000, 10000), options);
db.getCollection('BankAccount').aggregate(pipeline(30000, 10000), options);
db.getCollection('BankAccount').aggregate(pipeline(40000, 10000), options);
db.getCollection('BankAccount').aggregate(pipeline(50000, 10000), options);
db.getCollection('BankAccount').aggregate(pipeline(60000, 10000), options);
db.getCollection('BankAccount').aggregate(pipeline(70000, 10000), options);
db.getCollection('BankAccount').aggregate(pipeline(80000, 10000), options);
