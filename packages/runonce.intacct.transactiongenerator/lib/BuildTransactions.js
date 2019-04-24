'use strict';

const uuid = require('uuid/v4');
const rawBucket = require('./rawBucket.json');
const rawTransaction = require('./rawTransaction.json');


class BuildTransactions {
    constructor() {
        // do nothing
    }

    static Create() {
        return new BuildTransactions();
    }

    buildBuckets(...args) {
        return buildBucketsImpl(this, ...args);
    }

    buildTransactionBucket(...args) {
        return buildTransactionBucketImpl(this, ...args);
    }

    buildTransactionsforBucket(...args) {
        return buildTransactionsforBucketImpl(this, ...args);
    }
}

const buildBucketsImpl = ((self, bankAccountId, startNum, numTrx) => {
    const buckets = [];
    const bucketSize = 100;
    const quotient = Math.floor(numTrx / bucketSize);
    const remainder = numTrx % bucketSize;
    let startVal = startNum;
    // create buckets full of transactions
    for (let i = 0; i < quotient; i++) {
        buckets.push(buildTransactionBucketImpl(self, bankAccountId, startVal, bucketSize));
        startVal += bucketSize;
    }
    // create remainder transactions
    if (remainder && remainder > 0) {
        buckets.push(buildTransactionBucketImpl(self, bankAccountId, startVal, remainder));
    }
    return buckets;
});

const buildTransactionBucketImpl = ((self, bankAccountId, startNum, numTrx) => {
    const date = new Date().toISOString();
    let bucket = JSON.parse(JSON.stringify(rawBucket));
    bucket._id = uuid();
    bucket.region = 'USA'; // Where?
    bucket.bankAccountId = bankAccountId;
    bucket.startIncrementedId = startNum;
    bucket.endIncrementedId = startNum + (numTrx - 1);
    bucket.numberOfTransactions = numTrx;
    bucket.transactions = buildTransactionsforBucketImpl(self, bankAccountId, startNum, numTrx);
    bucket.created = date;
    bucket.startDate = date;
    bucket.endDate = new Date().toISOString();
    return bucket;
});

const buildTransactionsforBucketImpl = (self, bankAccountId, startNum, numTrx) => {
    const rawTransactions = [];
    for (let i = startNum; i <= numTrx; i++) {
        let transaction = JSON.parse(JSON.stringify(rawTransaction));
        transaction._id = uuid();
        transaction.bankAccountId = bankAccountId;
        transaction.datePosted = new Date().toISOString();
        transaction.dateUserInitiated = new Date().toISOString();
        transaction.transactionIndex = 0;
        transaction.fileIdentificationNumber = 0;
        transaction.incrementedId = i;
        transaction.transactionAmount = i / 100;
        transaction.referenceNumber = `ref ${i}`;
        transaction.narrative1 = `Invoice ${i}`;
        // transaction.transactionHash = getHash(GetS)
        rawTransactions.push(transaction);
    }
    return rawTransactions;
};

// const GetStringForHashing = (self, transaction, bankAccountNum, bankIdentifier) => {
//     const checkField = (fieldName, fieldValue) => {
//         if (_.isUndefined(fieldValue)) {
//             const message = format(resources.services.transaction.InvalidHashComponentMessage, fieldName);
//             const typeItem = new StatusCodeErrorItem(resources.services.transaction.InvalidHashComponent, message);
//             throw new StatusCodeError([typeItem], 400);
//         }
//     };
//
//     const dataFields = {
//         bankAccountNum,
//         bankIdentifier,
//         datePosted: transaction.datePosted,
//         transactionAmount: transaction.transactionAmount,
//         transactionType: transaction.transactionType,
//         transactionIndex: transaction.transactionIndex
//     };
//
//     if (transaction.aggregatorTransactionId !== undefined) {
//         dataFields.aggregatorTransactionId = transaction.aggregatorTransactionId;
//     } else {
//         dataFields.fileIdentificationNumber = transaction.fileIdentificationNumber;
//     }
//
//     checkField('bankAccountNum', dataFields.bankAccountNum);
//     checkField('bankIdentifier', dataFields.bankIdentifier);
//     checkField('datePosted', dataFields.datePosted);
//     checkField('transactionAmount', dataFields.transactionAmount);
//     checkField('transactionType', dataFields.transactionType);
//     checkField('transactionIndex', dataFields.transactionIndex);
//
//     if (transaction.aggregatorTransactionId !== undefined) {
//         checkField('aggregatorTransactionId', dataFields.aggregatorTransactionId);
//     } else {
//         checkField('fileIdentificationNumber', dataFields.fileIdentificationNumber);
//     }
//
//     return JSON.stringify(dataFields);
// };

module.exports = BuildTransactions;
