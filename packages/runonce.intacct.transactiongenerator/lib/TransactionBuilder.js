'use strict';

const rawTransaction = require('./rawTransaction.json');

const crypto = require('crypto');

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

const buildTransactionsImpl = (self, { bankAccount, numTrxToCreate, randomSignage = false }) => {
    const bankAccountId = bankAccount._id;
    const startNum = bankAccount.lastTransactionId + 1;

    const now = new Date().toISOString();
    return _.times(numTrxToCreate, (n) => {
        const rand = Math.floor(Math.random() * 100);
        const debit = randomSignage && rand >= 50;
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
        transaction.transactionHash = generateHash(bankAccount, transaction);

        if (bankAccount.defaultCurrency) {
            transaction.currency = bankAccount.defaultCurrency;
        }

        return transaction;
    });
};

const generateHash = (bankAccount, transaction) => {
    const dataFields = {
        bankAccountNum: bankAccount.accountIdentifier,
        bankIdentifier: bankAccount.bankIdentifier,
        datePosted: transaction.datePosted,
        transactionAmount: transaction.transactionAmount,
        transactionType: transaction.transactionType,
        transactionIndex: transaction.transactionIndex
    };

    if (transaction.aggregatorTransactionId !== undefined) {
        dataFields.aggregatorTransactionId = transaction.aggregatorTransactionId;
    } else {
        dataFields.fileIdentificationNumber = transaction.fileIdentificationNumber;
    }

    const stringified = JSON.stringify(dataFields);
    return crypto.createHash('sha256').update(stringified).digest('hex');
};

module.exports = TransactionBuilder;
