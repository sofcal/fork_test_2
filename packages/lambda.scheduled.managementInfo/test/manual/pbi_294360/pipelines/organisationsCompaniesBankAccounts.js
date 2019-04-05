/* eslint-disable */
var productId = "10000000-0000-0000-0000-000000000001";

var test = db.getCollection('Organisation').aggregate([ 
    { $match: { 'products.productId': productId } },

    // Unwind products into a result set.
    { $unwind: { path: '$products' } },

    // strip all but first document
    { $limit: 1 },

    // lookups for Organisation and OrganisationExt (return arrays)
    { $lookup: { from: 'Organisation', as: 'Org', localField: 'products.productId', foreignField: 'products.productId' } },
    { $lookup: { from: 'OrganisationExt', as: 'OrgExt', localField: 'products.productId', foreignField: 'products.productId' } },

    // Join arrays
    { $project: {
        _id: 0,
        Union: { $concatArrays: ['$Org', '$OrgExt'] }
    } },

    // Unwind the union collection into a result set.
    { $unwind: { path: '$Union', preserveNullAndEmptyArrays: true } },

    { $match: { 'Union.products.productId': productId } },

    // remove properties that we don't care about using a project
    { $project: {
        _id: "$Union._id",
        type: "$Union.type",
        // since products is an array, we need the map function to get it into the shape we want (with just an _id field)
        products: { $map: { input: '$Union.products', as: 'product', in: { _id: '$$product.productId' } } },
        bankAccountCount: { $size: '$Union.bankAccounts' },
        bankAccounts: "$Union.bankAccounts",
        companyCount: { $size: '$Union.companies' },
        companies: "$Union.companies",
    }},

    // Orig processing

    // unwind the bankAccounts array to give us a single document for each bank account
    { $unwind: { path: '$bankAccounts', preserveNullAndEmptyArrays: true } },
    // use the lookup stage and for each document, retrieve the bank account specified by the bankAccountId
    { $lookup: { from: 'BankAccount', localField: 'bankAccounts.bankAccountId', foreignField: '_id', as: 'bankAccountLookup' } },
    // since lookup gives us an array of results (even though we know there's only one for each, we unwind again to turn bankAccountLookup into an object
    { $unwind: { path: '$bankAccountLookup', preserveNullAndEmptyArrays: true } },
    // and now lookup the bank object too
    { $lookup: { from: 'Bank', localField: 'bankAccountLookup.bankId', foreignField: '_id', as: 'bankLookup' } },
    {
        $project: {
            // most the fields we're projecting we haven't touch yet, this phase really just deals with filtering out a lot
            // of information we don't want or neeed, and creating a proper summary entry for the bank account
            _id: 1,
            type: 1,
            products: 1,
            companyCount: 1,
            companies: 1,
            bankAccountCount: 1,
            bankAccounts: {
                // we want to ensure that all the bank account fields are present, regardless or whether we found a bank account
                // so we use a conditional ($cond) to set the field to a valid value or null if no bank account was found
                _id: '$bankAccounts.bankAccountId',
                region: 1,
                deleted: { $cond: [{ $not: ['$bankAccounts.deleted'] }, null, '$bankAccounts.deleted'] },

                // keeping track of the 'missing' bank accounts in a simple boolean field will help us in the code stages
                missing: { $cond: [{ $not: ['$bankAccountLookup'] }, true, false] },

                status: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.status'] },
                transactionCount: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.lastTransactionId'] },
                unresolvedCount: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.lastHeldTransactionId'] },
                bankId: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.bankId'] },
                bankName: { $cond: [{ $not: ['$bankAccountLookup'] }, null, { $arrayElemAt: ['$bankLookup.name', 0] }] },
                aggregatorName: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.aggregatorName'] },
                accountantManaged: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.accountant.accountantManaged'] }
            }
        }
    },
    // now we group documents back up again by their organisationId (and a few other fields which we know will be the same - because we unwound)
    // the main reason for this stage is to push all the bank accounts for an organisation back into an array.
    { $group: { _id: { _id: '$_id', type: '$type', products: '$products', companyCount: '$companyCount', companies: '$companies', bankAccountCount: '$bankAccountCount' }, bankAccounts: { $addToSet: '$bankAccounts' } } },
    // because we're on mongo 3.2, we have no replaceRoot function, so we have this slightly ugly projection to get rid of our nested _id object field
    { $project: { _id: '$_id._id', type: '$_id.type', products: '$_id.products', companyCount: '$_id.companyCount', companies: '$_id.companies', bankAccountCount: '$_id.bankAccountCount', bankAccounts: '$bankAccounts' } },

    // we now go through the same process as for bank accounts, but for companies. Unwinding the array...
    { $unwind: { path: '$companies', preserveNullAndEmptyArrays: true } },





    // ... retrieving the company objects with lookups
    { $lookup: { from: 'Company', localField: 'companies', foreignField: '_id', as: 'companyLookup' } },
    { $lookup: { from: 'CompanyExt', localField: 'companies', foreignField: '_id', as: 'companyExtLookup' } },

    // Join arrays
    {
        $project: {
            _id: 1,
            type: 1,
            products: 1,
            bankAccountCount: 1,
            bankAccounts: 1,
            companyCount: 1,
            companies: 1,
            companyLookup: { $concatArrays: ['$companyLookup', '$companyExtLookup'] },
        }
    },

    // ... unwinding the documents to create one per company
    { $unwind: { path: '$companyLookup', preserveNullAndEmptyArrays: true } },


    {
        // ...projecting it all so the companies object on each document contains the information we want
        $project: {
            _id: 1,
            type: 1,
            products: 1,
            bankAccountCount: 1,
            bankAccounts: 1,
            companyCount: 1,
            companies: {
                // _id: '$companies',
                // someCompanies: { Union: { $concatArrays: ['$companyLookup', '$companyExtLookup'] } },
                // bankAccountCount: { $size: { $cond: [{ $not: ['$companyLookup.bankAccounts'] }, [], '$companyLookup.bankAccounts'] } },

                // missing: { $cond: [{ $not: ['$companyLookup'] }, true, false] }
                _id: '$companies',
                bankAccountCount: { $size: { $cond: [{ $not: ['$companyLookup.bankAccounts'] }, [], '$companyLookup.bankAccounts'] } },

                missing: { $cond: [{ $not: ['$companyLookup'] }, true, false] }                
            }
        }
    },
    // ...grouping back up so we can push the companies back into an array
    { $group: { _id: { _id: '$_id', type: '$type', products: '$products', bankAccounts: '$bankAccounts', bankAccountCount: '$bankAccountCount', companyCount: '$companyCount' }, companies: { $addToSet: '$companies' } } },
    // ...and projecting against to get rid of the nasty nested _id object
    {
        $project: {
            _id: '$_id._id',
            type: '$_id.type',
            products: '$_id.products',
            companyCount: '$_id.companyCount',
            companies: { $cond: [{ $gt: ['$_id.companyCount', 0] }, '$companies', []] },
            bankAccountCount: '$_id.bankAccountCount',
            bankAccounts: { $cond: [{ $gt: ['$_id.bankAccountCount', 0] }, '$_id.bankAccounts', []] }
        }
    }

]);

while ( test.hasNext() ) {
    printjson( test.next() );
 }
