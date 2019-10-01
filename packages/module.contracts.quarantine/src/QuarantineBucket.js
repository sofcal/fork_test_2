'use strict';

const resources = require('@sage/bc-common-resources');
const { Transaction } = require('@sage/bc-contracts-transaction');
const validators = require('@sage/bc-services-validators');
const _ = require('underscore');

function QuarantineBucket(data) {
    if (data) {
        this.uuid = data.uuid;
        this.region = data.region;
        this.bankId = data.bankId;
        this.s3FileName = data.s3FileName;
        this.index = data.index;
        this.firstItem = data.firstItem;
        this.lastItem = data.lastItem;
        this.numberOfTransactions = data.numberOfTransactions;
        this.transactions = _.map(data.transactions || [], (t) => (new Transaction(t)));
        this.startDate = data.startDate;
        this.endDate = data.endDate;
    }
}

QuarantineBucket.validate = function (quarantineBucket) {
    let validateTransactions = function(quarantined){
        let items = [];

        _.each(quarantined, function(quarantine){
            items.push.apply(items, Transaction.validate(quarantine, true));
        });

        return items;
    };

    const properties = [
        {path: 'uuid', regex: resources.regex.uuid},
        {path: 's3FileName', custom: _.isString},
        {path: 'region', regex: resources.regex.transactionBucket.region},
        {path: 'bankId', regex: resources.regex.uuid},
        {path: 'index', custom: _.isNumber},
        {path: 'firstItem', custom: _.isNumber},
        {path: 'lastItem', custom: _.isNumber},
        {path: 'numberOfTransactions', custom: _.isNumber},
        {path: 'transactions', arrayCustom: validateTransactions, optional : true},
        {path: 'startDate', custom: _.isDate, optional: true, allowNull: true },
        {path: 'endDate', custom: _.isDate, optional: true, allowNull: true }
    ];

    validators.validateContractObject(quarantineBucket, QuarantineBucket, properties);
};

let p = QuarantineBucket.prototype;

p.validate = function () {
    QuarantineBucket.validate(this);
};

module.exports = QuarantineBucket;

QuarantineBucket.MAX_BUCKET_SIZE = resources.api.pageSize;
