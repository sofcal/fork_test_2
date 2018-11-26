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
        // find all organisations for the product/organisationId
        // { $match: { 'products.productId': productId } },
        { $match: { _id: { $in: ['5a1431ff-16b2-48ca-9c5e-c6c80c9db5bd', 'c66b1e91-6987-46fa-b624-d0875be2cb13'] } } },
        // remove properties that we don't care about using a project
        {
            $project: {
                _id: '$_id',
                type: '$type',
                // since products is an array, we need the map function to get it into the shape we want (with just an _id field)
                products: { $map: { input: '$products', as: 'product', in: { _id: '$$product.productId' } } },
                bankAccounts_bck: '$bankAccounts',
                bankAccounts: '$bankAccounts',
                companies_bck: '$companies',
                companies: '$companies'
            }
        },
        // unwind the bankAccounts array to give us a single document for each bank account * see $unwind comment below
        { $unwind: { path: '$bankAccounts', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'BankAccount', localField: 'bankAccounts.bankAccountId', foreignField: '_id', as: 'bankAccountLookup' } },
        { $unwind: { path: '$bankAccountLookup', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'Bank', localField: 'bankAccountLookup.bankId', foreignField: '_id', as: 'bankLookup' } },
        {
            $project: {
                _id: '$_id',
                type: '$type',
                products: '$products',
                companies: '$companies',
                bankAccounts: {
                    _id: '$bankAccounts.bankAccountId',
                    region: '$bankAccounts.region',
                    deleted: { $cond: [{ $not: ['$bankAccounts.deleted'] }, null, '$bankAccounts.deleted'] },
                    // deleted: { $cond: { if: { $eq: ['$bankAccounts.deleted', undefined] }, then: null, else: '$bankAccounts.deleted' } },

                    missing: { $cond: [{ $not: ['$bankAccountLookup'] }, true, false] },
                    // missing: { $cond: { if: { $eq: ['$bankAccountLookup', undefined] }, then: true, else: false } },

                    status: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.status'] },
                    // status: { $cond: { if: { $eq: ['$bankAccountLookup', undefined] }, then: null, else: '$bankAccountLookup.status' } },
                    bankId: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.bankId'] },
                    bankName: { $cond: [{ $not: ['$bankAccountLookup'] }, null, { $arrayElemAt: ['$bankLookup.name', 0] }] },
                    // bankName: { $cond: { if: { $eq: ['$bankAccountLookup', undefined] }, then: null, else: { $arrayElemAt: ['$bankLookup.name', 0] } } },
                    aggregatorName: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.aggregatorName'] },
                    // aggregatorName: { $cond: { if: { $eq: ['$bankAccountLookup', undefined] }, then: null, else: '$bankAccountLookup.aggregatorName' } },
                    accountantManaged: { $cond: [{ $not: ['$bankAccountLookup'] }, null, '$bankAccountLookup.accountant.accountantManaged'] },
                    // accountantManaged: { $cond: { if: { $eq: ['$bankAccountLookup', undefined] }, then: null, else: '$bankAccountLookup.accountant.accountantManaged' } },
                }
            }
        },
        { $group: { _id: { _id: '$_id', type: '$type', products: '$products', companies: '$companies' }, bankAccounts: { $addToSet: '$bankAccounts' } } },
        { $project: { _id: '$_id._id', type: '$_id.type', products: '$_id.products', companies: '$_id.companies', bankAccounts: '$bankAccounts' } },

        { $unwind: { path: '$companies', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'Company', localField: 'companies', foreignField: '_id', as: 'companyLookup' } },
        { $unwind: { path: '$companyLookup', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: '$_id',
                type: '$type',
                products: '$products',
                bankAccounts: '$bankAccounts',
                companies: {
                    _id: '$companies',
                    bankAccountCount: { $size: { $cond: [{ $not: ['$companyLookup.bankAccounts'] }, [], '$companyLookup.bankAccounts'] } },
                    // bankAccountCount: { $size: { $cond: { if: { $eq: ['$companyLookup.bankAccounts', undefined] }, then: [], else: '$companyLookup.bankAccounts' } } },

                    missing: { $cond: [{ $not: ['$companyLookup'] }, true, false] },
                    // missing: { $cond: { if: { $eq: ['$companyLookup', undefined] }, then: true, else: false } }
                }
            }
        },
        { $group: { _id: { _id: '$_id', type: '$type', products: '$products', bankAccounts: '$bankAccounts' }, companies: { $addToSet: '$companies' } } },
        { $project: { _id: '$_id._id', type: '$_id.type', products: '$_id.products', companies: '$companies', bankAccounts: '$_id.bankAccounts', bankAccountCount: { $size: '$_id.bankAccounts' }, companyCount: { $size: '$companies' } } },
    ];

    if (count) {
        pipeline.push({ $group: { _id: null, count: { $sum: 1 } } });
    }

    return pipeline;
};
