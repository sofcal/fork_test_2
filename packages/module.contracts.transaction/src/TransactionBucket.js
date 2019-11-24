'use strict';

const resources = require('@sage/bc-common-resources');
const Transaction = require('./Transaction');
const utils = require('@sage/bc-services-validators');

const uuid = require('uuid');
const _ = require('underscore');

function TransactionBucket(data) {
    if (data) {
        if (_idField === TransactionBucket.ID_FIELDS.legacy) {
            this.uuid = data.uuid || uuid.v4();
        } else {
            this._id = data._id || uuid.v4();
        }

        this.region = data.region;
        this.bankAccountId = data.bankAccountId;
        this.startIncrementedId = data.startIncrementedId;
        this.endIncrementedId = data.endIncrementedId;
        this.startDate = data.startDate;
        this.endDate = data.endDate;
        this.numberOfTransactions = data.numberOfTransactions;
        this.transactions = _.map(data.transactions || [], (t) => (new Transaction(t)));

        this.source = data.source || 'client';      // TODO should move source out of providerAPI and into shared
        this.created = data.created || new Date();
        this.updated = data.updated || new Date();
    }
}

TransactionBucket.validate = TransactionBucket.Validate = function(transactionBucket) {
    if (!this.source) {
        this.source = 'client';         // TODO forces source: client onto existing documents even if they didn't go through constructor
    }

    const validateTransactions = function(transactions) {
        let items = [];

        _.each(transactions, (transaction) => {
            items.push(...Transaction.validate(transaction, true));
        });

        return items;
    };

    const properties = [
        { path: (TransactionBucket.IsLegacy() ? 'uuid' : '_id'), regex: resources.regex.uuid },
        { path: 'bankAccountId', regex: resources.regex.uuid },
        { path: 'region', regex: resources.regex.transactionBucket.region },
        { path: 'startIncrementedId', custom: _.isNumber },
        { path: 'endIncrementedId', custom: _.isNumber },
        { path: 'numberOfTransactions', custom: _.isNumber },
        { path: 'transactions', arrayCustom: validateTransactions, optional: true },

        // startDate and endDate are optional, only present on the main transaction collection
        { path: 'startDate', custom: _.isDate, optional: false, allowNull: false },
        { path: 'endDate', custom: _.isDate, optional: false, allowNull: false }
    ];

    utils.validateContractObject(transactionBucket, TransactionBucket, properties);
};

const p = TransactionBucket.prototype;

p.validate = function() {
    TransactionBucket.validate(this);
};

p.isFull = function() {
    return this.transactions.length >= TransactionBucket.MAX_BUCKET_SIZE;
};

p.calculateRanges = function() {
    const dateRange = TransactionBucket.getDatePostedRange(this.transactions);

    this.startDate = dateRange.startDate || new Date(null);
    this.endDate = dateRange.endDate || new Date(null);

    this.startIncrementedId = (_.first(this.transactions) || {}).incrementedId;
    this.endIncrementedId = (_.last(this.transactions) || {}).incrementedId;

    this.numberOfTransactions = this.transactions.length;
};

p.addTransaction = function(transaction) {
    this.transactions.push(transaction);
};

p.addTransactions = function(transactions) {
    this.transactions.push(transactions);
};

module.exports = TransactionBucket;

TransactionBucket.Create = (...args) => {
    return new TransactionBucket(...args);
};

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

TransactionBucket.SetIdField = (idField) => { _idField = idField; };
TransactionBucket.IsLegacy = () => _idField === TransactionBucket.ID_FIELDS.legacy;
TransactionBucket.ID_FIELDS = Object.freeze({ legacy: 'uuid', mongoDB: '_id' });
let _idField = TransactionBucket.ID_FIELDS.legacy;
