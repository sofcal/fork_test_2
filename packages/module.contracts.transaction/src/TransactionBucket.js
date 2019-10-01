'use strict';

const resources = require('@sage/bc-common-resources');
const Transaction = require('./Transaction');
const utils = require('@sage/bc-services-validators');
const _ = require('underscore');

function TransactionBucket(data) {
    if (data) {
        this.uuid = data.uuid;

        this.region = data.region;
        this.bankAccountId = data.bankAccountId;
        this.startIncrementedId = data.startIncrementedId;
        this.endIncrementedId = data.endIncrementedId;
        this.startDate = data.startDate;
        this.endDate = data.endDate;
        this.numberOfTransactions = data.numberOfTransactions;
        this.transactions = _.map(data.transactions || [], (t) => (new Transaction(t)));
    }
}

TransactionBucket.validate = function (transactionBucket) {
    const validateTransactions = function(transactions){
        let items = [];

        _.each(transactions, (transaction) => {
            items.push(...Transaction.validate(transaction, true));
        });

        return items;
    };

    const properties = [
        {path: 'uuid', regex: resources.regex.uuid},
        {path: 'bankAccountId', regex: resources.regex.uuid},
        {path: 'region', regex: resources.regex.transactionBucket.region},
        {path: 'startIncrementedId', custom: _.isNumber},
        {path: 'endIncrementedId', custom: _.isNumber},
        {path: 'numberOfTransactions', custom: _.isNumber},
        {path: 'transactions', arrayCustom: validateTransactions, optional: true},

        // startDate and endDate are optional, only present on the main transaction collection
        {path: 'startDate', custom: _.isDate, optional: false, allowNull: false },
        {path: 'endDate', custom: _.isDate, optional: false, allowNull: false }
    ];

    utils.validateContractObject(transactionBucket, TransactionBucket, properties);
};

let p = TransactionBucket.prototype;

p.validate = function () {
    TransactionBucket.validate(this);
};

module.exports = TransactionBucket;

TransactionBucket.MAX_BUCKET_SIZE = resources.api.pageSize;

TransactionBucket.getDatePostedRange = (transactions, checkInitiatedDate = false) => {
    const response = { startDate: null, endDate: null };
    _.each(transactions, (t) => {
        if (t.datePosted && (!response.startDate || t.datePosted < response.startDate)) {
            response.startDate = new Date(t.datePosted);
        }

        if (t.datePosted && (!response.endDate || t.datePosted > response.endDate)) {
            response.endDate = new Date(t.datePosted);
        }

        if (checkInitiatedDate) {
            if (t.dateUserInitiated && (!response.startDate || t.dateUserInitiated < response.startDate)) {
                response.startDate = new Date(t.dateUserInitiated);
            }

            if (t.dateUserInitiated && (!response.endDate || t.dateUserInitiated > response.endDate)) {
                response.endDate = new Date(t.dateUserInitiated);
            }
        }
    });

    return response;
};
