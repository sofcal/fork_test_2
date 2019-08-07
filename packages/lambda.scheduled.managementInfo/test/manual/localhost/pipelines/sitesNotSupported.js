/* eslint-disable */
var count = false;

var productId = '2ac2a370-6f73-4be4-b138-08eb9f2e7992';

// copy of pipeline from db/pipelines/sitesNotSupported.js as cannot use require in Mongo shell
var pipeline = [
    { $match: { 'products.productId': productId } },
    // remove properties that we don't care about using a project
    {
        $project: {
            _id: 1,
            type: 1,
            // since products is an array, we need the map function to get it into the shape we want (with just an _id field)
            products: { $map: { input: '$products', as: 'product', in: { _id: '$$product.productId' } } },
            bankAccounts: 1
        },
    },
    // unwind the bankAccounts array to give us a single document for each bank account
    { $unwind: { path: '$bankAccounts', preserveNullAndEmptyArrays: true } },
    // use the lookup stage and for each document, retrieve the bank account specified by the bankAccountId
    { $lookup: { from: 'BankAccount', localField: 'bankAccounts.bankAccountId', foreignField: '_id', as: 'bankAccountLookup' } },
    // since lookup gives us an array of results (even though we know there's only one for each, we unwind again to turn bankAccountLookup into an object
    { $unwind: { path: '$bankAccountLookup', preserveNullAndEmptyArrays: true } },
    // we're only interested in Yodlee bank accounts where siteNotSupported is set to true
    { $match: {$and: [ { 'bankAccountLookup.internal.siteNotSupported': true }, { 'bankAccountLookup.aggregatorName': 'yodlee' } ] } },
    {
        $project: {
            _id: 1,
            bankAccountLookup: {
                _id: 1
            }
        },
    }
];

if (count) {
    // if count was specified, this line will give the total number of Yodlee bank accounts with siteNotSupported set
    pipeline.push({ $group: { _id: null, count: { $sum: 1 } } });
}

var test = db.getCollection('Organisation').aggregate(pipeline);

// Print results
printjson( test.toArray() );