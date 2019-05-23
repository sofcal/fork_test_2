'use strict';

const rawBucket = require('./rawBucket.json');
const rawTransaction = require('./rawTransaction.json');

const uuid = require('uuid/v4');
const _ = require('underscore');


class TransactionBuilder {
    constructor() {
        // do nothing
    }

    static Create() {
        return new TransactionBuilder();
    }

    buildTransactions(...args) {
        return buildTransactionsImpl(this, ...args);
    }
}

const buildTransactionsImpl = (self, { bankAccount, numTrxToCreate}) => {
    const bankAccountId = bankAccount._id;
    const startNum = bankAccount.lastTransactionId + 1;

    const now = new Date().toISOString();
    return _.times(numTrxToCreate, (n) => {
        const rand = Math.floor(Math.random() * 100);
        const debit = rand >= 50;
        const i = startNum + n;
        const transaction = JSON.parse(JSON.stringify(rawTransaction));
        transaction._id = uuid();
        transaction.bankAccountId = bankAccountId;
        transaction.datePosted = now;
        transaction.dateUserInitiated = now;
        transaction.dateFundsAvailable = now;
        transaction.transactionIndex = 0;
        transaction.fileIdentificationNumber = 0;
        transaction.incrementedId = i;
        transaction.transactionType = debit ? 'DEBIT' : 'CREDIT';
        transaction.transactionAmount = (debit ? -1 : 1) * (i / 100);
        transaction.referenceNumber = `ref ${i}`;

        transaction.narrative1 = `Invoice ${i}`;
        // transaction.transactionHash = getHash(GetS)

        if (bankAccount.defaultCurrency) {
            transaction.currency = bankAccount.defaultCurrency;
        }

        return transaction;
    });
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

module.exports = TransactionBuilder;
