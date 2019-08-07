'use strict';

module.exports = ({ productId, count } = {}) => {
    const pipeline = [
        { $match: { 'products.productId': productId } },
        // remove properties that we don't care about using a project
        {
            $project: {
                _id: 1,
                type: 1,
                // since products is an array, we need the map function to get it into the shape we want (with just an _id field)
                products: { $map: { input: '$products', as: 'product', in: { _id: '$$product.productId' } } },
                bankAccountCount: { $size: '$bankAccounts' },
                bankAccounts: 1
            },
        },
        // unwind the bankAccounts array to give us a single document for each bank account
        { $unwind: { path: '$bankAccounts', preserveNullAndEmptyArrays: true } },
        // use the lookup stage and for each document, retrieve the bank account specified by the bankAccountId
        { $lookup: { from: 'BankAccount', localField: 'bankAccounts.bankAccountId', foreignField: '_id', as: 'bankAccountLookup' } },
        // since lookup gives us an array of results (even though we know there's only one for each, we unwind again to turn bankAccountLookup into an object
        { $unwind: { path: '$bankAccountLookup', preserveNullAndEmptyArrays: true } },
        // we're only interested in yodlee bank accounts where siteNotSupported is set to true
        { $match: {$and: [ { 'bankAccountLookup.internal.siteNotSupported': true }, { 'bankAccountLookup.aggregatorName': 'yodlee' } ] } },
    ];


    if (count) {
        // if count was specified, this line will give the total number of Yodlee bank accounts with siteNotSupported set
        pipeline.push({ $group: { _id: null, count: { $sum: 1 } } });
    }

    return pipeline;
};
