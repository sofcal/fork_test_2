'use strict';

const { timer } = require('@sage/bc-debug-utils');

const Promise = require('bluebird');
const _ = require('underscore');

class DBQueries {
    constructor(db) {
        this.db = db;
    }

    static Create(...args) {
        return new DBQueries(...args);
    }

    getManualUploadedCounts(...args) {
        return getManualUploadedCountsImpl(this, ...args);
    }

    getTransactionSyncResults(...args) {
        return getTransactionSyncResultsImpl(this, ...args);
    }

    getBankInfo(...args) {
        return getBankInfoImpl(this, ...args);
    }
}

const getManualUploadedCountsImpl = Promise.method((self, { region, startDate, emailBlacklist = [], aggregatorWhitelist = [], all = false }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.getBankAccountsById`;
    logger.debug({ function: func, log: 'started', params: { all, region, startDate, aggregatorWhitelist, emailBlacklistLength: emailBlacklist.length } });

    const collection = self.db.collection('Transaction');

    const promise = collection.aggregate([
        //{ $match: { _id: '752e73a5-09ad-492e-8b43-e2bc819ea790' } },
        { $match: { region, endDate: { $gt: startDate }, 'transactions.feedSource': 'manual' } },
        { $unwind: { path: '$transactions', preserveNullAndEmptyArrays: false } },
        { $match: { 'transactions.feedSource': 'manual' } },
        { $group: { _id: '$bankAccountId', manualCount: { $sum: 1 } }},
        { $lookup: { from: 'BankAccount', localField: '_id', foreignField: '_id', as: 'bankAccountLookup' } },
        { $unwind: { path: '$bankAccountLookup', preserveNullAndEmptyArrays: false } },
        { $lookup: { from: 'Organisation', localField: 'bankAccountLookup.organisationId', foreignField: '_id', as: 'organisationLookup' } },
        { $project: { _id: 1, manualCount: 1, aggregatorName: '$bankAccountLookup.aggregatorName', organisationId: '$bankAccountLookup.organisationId', adminEmail: { $arrayElemAt: ['$organisationLookup.adminEmail', 0] } } },
        { $match: { adminEmail: { $nin: emailBlacklist }, aggregatorName: { $in: aggregatorWhitelist } } },
        { $project: { bankAccountId: '$_id', manualCount: 1, organisationId: 1, aggregatorName: 1 } },
        {
            $group: {
                _id: '$aggregatorName',
                bankAccounts: { $addToSet: { bankAccountId: '$_id', organisationId: '$organisationId', manualCount: '$manualCount' } }
            }
        }
    ], consts.DEFAULT_OPTIONS);

    const hr = timer.start();

    return Promise.resolve(undefined)
        .then(() => {
            if (!all) {
                logger.debug({ function: func, log: 'ended - all not specified, returning cursor', params: { all } });
                return promise
            }

            logger.debug({ function: func, log: 'WARNING: requesting all results without a cursor could present a performance issue', params: { all } });
            logger.debug({ function: func, log: 'ended - all specified; returning entire array', params: { all } });
            return promise.toArray()
                .then((results = []) => results)
        })
        .finally(() => {
            timer.end(hr);
        })
});

const getTransactionSyncResultsImpl = Promise.method((self, { region, startDate, emailBlacklist = [], aggregatorWhitelist = [], all = false }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.getBankAccountsById`;
    logger.debug({ function: func, log: 'started', params: { all, region, startDate, aggregatorWhitelist, emailBlacklistLength: emailBlacklist.length } });

    const collection = self.db.collection('BankAccount');

    const statusWhitelist = ['active', 'verifyingAuth', 'authRequired'];

    const promise = collection.aggregate([
        { $match: { status: { $in: statusWhitelist }, region, aggregatorName: { $in: aggregatorWhitelist } } },
        { $lookup: { from: 'Organisation', localField: 'organisationId', foreignField: '_id', as: 'organisationLookup' } },
        { $project: { _id: 1, bankId: 1, lastTransactionsReceived: 1, aggregatorName: 1, internal: 1, adminEmail: { $arrayElemAt: ['$organisationLookup.adminEmail', 0] } } },
        { $match: { adminEmail: { $nin: emailBlacklist } } },
        {
            $group: {
                _id: { aggregatorName: '$aggregatorName', statusCode: '$internal.providerStatus.statusCode' },
                total: { $sum: 1 },
                hasReceivedTransactionsCount: { $sum: { $cond: [{ $gte: ['$lastTransactionsReceived', startDate] }, 1, 0] } },
                notReceivedTransactionsCount: { $sum: { $cond: [{ $lt: ['$lastTransactionsReceived', startDate] }, 1, 0] } },
                status: {
                    $first: {
                        status: '$internal.providerStatus.status',
                        statusMessage: '$internal.providerStatus.statusMessage',
                        statusCode: '$internal.providerStatus.statusCode'
                    }
                },
                banksWithThisStatus: { $addToSet: '$bankId' }
            }
        },
        {
            $group: {
                _id: '$_id.aggregatorName',
                total: { $sum: '$total' },

                hasReceivedTransactionsCount: { $sum: '$hasReceivedTransactionsCount' },
                notReceivedTransactionsCount: { $sum: '$notReceivedTransactionsCount' },
                statuses: {
                    $push: {
                        status: '$status.status',
                        statusMessage: '$status.statusMessage',
                        statusCode: '$status.statusCode',
                        total: '$total',
                        banksWithThisStatus: '$banksWithThisStatus'
                    }
                }
            }
        }
    ], consts.DEFAULT_OPTIONS);

    const hr = timer.start();

    return Promise.resolve(undefined)
        .then(() => {
            if (!all) {
                logger.debug({ function: func, log: 'ended - all not specified, returning cursor', params: { all } });
                return promise
            }

            logger.debug({ function: func, log: 'WARNING: requesting all results without a cursor could present a performance issue', params: { all } });
            logger.debug({ function: func, log: 'ended - all specified; returning entire array', params: { all } });
            return promise.toArray()
                .then((results = []) => results)
        })
        .finally(() => {
            timer.end(hr);
        })
});

const getBankInfoImpl = Promise.method((self, { region, aggregatorWhitelist = [], all = false }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.getBankAccountsById`;
    logger.debug({ function: func, log: 'started', params: { all, region, aggregatorWhitelist } });

    const collection = self.db.collection('Bank');

    const promise = collection.aggregate([
        { $match: { primaryCountry: region, aggregatorName: { $in: aggregatorWhitelist } } },
        {
            $group: {
                _id: '$aggregatorName',
                banks: { $addToSet: { bankId: '$_id', bankName: '$name', status: '$status', aggregatorId: '$aggregatorId' } }
            }
        }
    ], consts.DEFAULT_OPTIONS);

    const hr = timer.start();

    return Promise.resolve(undefined)
        .then(() => {
            if (!all) {
                logger.debug({ function: func, log: 'ended - all not specified, returning cursor', params: { all } });
                return promise
            }

            logger.debug({ function: func, log: 'WARNING: requesting all results without a cursor could present a performance issue', params: { all } });
            logger.debug({ function: func, log: 'ended - all specified; returning entire array', params: { all } });
            return promise.toArray()
                .then((results = []) => results)
        })
        .finally(() => {
            timer.end(hr);
        })
});

const consts = {
    DEFAULT_OPTIONS: Object.freeze({ readPreference: 'secondary', allowDiskUse: true }),
    LOG_PREFIX: DBQueries.name
};

module.exports = DBQueries;
