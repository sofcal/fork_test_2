'use strict';

// project
const ErrorSpecs = require('../../ErrorSpecs');

// internal modules
const { StatusCodeError } = require('internal-status-code-error');

// external modules
const _ = require('underscore');

module.exports = ({ productId, count } = {}) => {
    if (!productId) {
        const spec = _.extend({ params: { productId } }, ErrorSpecs.pipeline.invalidPropertiesOCB);
        throw StatusCodeError.CreateFromSpecs([spec], spec.statusCode);
    }

    const $match = { };
    if (productId) {
        $match['products.productId'] = productId;
    }

    const pipeline = [
        { $match: { 'products.productId': productId } },
        // { $match: { _id: { $in: ['782c0a2f-854b-4488-856d-681d2f776f63', 'd6fff9c2-afba-4b45-a38d-3810a7ea54a5'] } } },
        // remove properties that we don't care about using a project
        {
            $project: {
                _id: 1,
                type: 1,
                // since products is an array, we need the map function to get it into the shape we want (with just an _id field)
                products: { $map: { input: '$products', as: 'product', in: { _id: '$$product.productId' } } },
                bankAccountCount: { $size: '$bankAccounts' },
                bankAccounts: 1,
                companyCount: { $size: '$companies' },
                companies: 1
            }
        },
        // unwind the bankAccounts array to give us a single document for each bank account * see $unwind comment below
        { $unwind: { path: '$bankAccounts', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'BankAccount', localField: 'bankAccounts.bankAccountId', foreignField: '_id', as: 'bankAccountLookup' } },
        { $unwind: { path: '$bankAccountLookup', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'Bank', localField: 'bankAccountLookup.bankId', foreignField: '_id', as: 'bankLookup' } },
        {
            $project: {
                _id: 1,
                type: 1,
                products: 1,
                companyCount: 1,
                companies: 1,
                bankAccountCount: 1,
                bankAccounts: {
                    _id: '$bankAccounts.bankAccountId',
                    region: 1,
                    deleted: { $cond: [{ $not: ['$bankAccounts.deleted'] }, null, '$bankAccounts.deleted'] },

                    missing: { $cond: [{ $not: ['$bankAccountLookup'] }, true, false] },

                    status: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.status'] },
                    transactionCount: { $cond: [{ $not: ['$bankAccountLookup'] }, null, { $add: ['$lastTransactionId', '$lastHeldTransactionId'] }] },
                    bankId: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.bankId'] },
                    bankName: { $cond: [{ $not: ['$bankAccountLookup'] }, null, { $arrayElemAt: ['$bankLookup.name', 0] }] },
                    aggregatorName: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.aggregatorName'] },
                    accountantManaged: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.accountant.accountantManaged'] }
                }
            }
        },
        { $group: { _id: { _id: '$_id', type: '$type', products: '$products', companyCount: '$companyCount', companies: '$companies', bankAccountCount: '$bankAccountCount' }, bankAccounts: { $addToSet: '$bankAccounts' } } },
        { $project: { _id: '$_id._id', type: '$_id.type', products: '$_id.products', companyCount: '$_id.companyCount', companies: '$_id.companies', bankAccountCount: '$_id.bankAccountCount', bankAccounts: '$bankAccounts' } },

        { $unwind: { path: '$companies', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'Company', localField: 'companies', foreignField: '_id', as: 'companyLookup' } },
        { $unwind: { path: '$companyLookup', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                type: 1,
                products: 1,
                bankAccountCount: 1,
                bankAccounts: 1,
                companyCount: 1,
                companies: {
                    _id: '$companies',
                    bankAccountCount: { $size: { $cond: [{ $not: ['$companyLookup.bankAccounts'] }, [], '$companyLookup.bankAccounts'] } },

                    missing: { $cond: [{ $not: ['$companyLookup'] }, true, false] }
                }
            }
        },
        { $group: { _id: { _id: '$_id', type: '$type', products: '$products', bankAccounts: '$bankAccounts', bankAccountCount: '$bankAccountCount', companyCount: '$companyCount' }, companies: { $addToSet: '$companies' } } },
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
    ];

    if (count) {
        pipeline.push({ $group: { _id: null, count: { $sum: 1 } } });
    }

    return pipeline;
};
