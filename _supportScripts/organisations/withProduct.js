var pipeline = (skip, limit) => {
    return [
        { $skip: skip },
        { $limit: limit },
        { $project: { _id: 1, productId: { $arrayElemAt: ['$products.productId', 0] }, created: 1 } },
        { $lookup: { from: 'Product', localField: 'productId', foreignField: '_id', as: 'productLookup' } },
        { $unwind: { path: '$productLookup', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                productId: 1,
                productHeader: '$productLookup.header',
                created: { $dateToString: { format: '%Y-%m-%dT%H:%M:%S:%LZ', date: '$created' } }
            }
        },
        {
            $group: {
                _id: 1,
                organisations: {
                    $addToSet: {
                        organisationId: '$_id',
                        productId: '$productId',
                        productHeader: '$productHeader',
                        organisationCreated: '$created'
                    }
                }
            }
        }
    ];
};

var options = { allowDiskUse: true };
db.getCollection('Organisation').aggregate(pipeline(0, 10000), options);
db.getCollection('Organisation').aggregate(pipeline(10000, 10000), options);
db.getCollection('Organisation').aggregate(pipeline(20000, 10000), options);
db.getCollection('Organisation').aggregate(pipeline(30000, 10000), options);
db.getCollection('Organisation').aggregate(pipeline(40000, 10000), options);
db.getCollection('Organisation').aggregate(pipeline(50000, 10000), options);
db.getCollection('Organisation').aggregate(pipeline(60000, 10000), options);
db.getCollection('Organisation').aggregate(pipeline(70000, 10000), options);
db.getCollection('Organisation').aggregate(pipeline(80000, 10000), options);
