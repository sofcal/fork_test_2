'use strict';

// project
const pipelines = require('./pipelines');

// internal modules

// external modules
const Promise = require('bluebird');
const _ = require('underscore');

class DBQueries {
    constructor({ db }) {
        this.db = db;
        this.pipelines = pipelines;
    }

    setFeatureOption(...args) {
        return setFeatureOptionImpl(this, ...args);
    }
}

const setFeatureOptionImpl = Promise.method((self, { bankAccountId, featureOptions }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.setFeatureOption`;
    logger.debug({ function: func, log: 'started', params: { bankAccountId, featureOptions } });

    const collection = self.db.collection('BankAccount');

    const toSet = {};
    _.each(_.keys(featureOptions), (k) => {
        toSet[`featureOptions.${k}`] = featureOptions[k];
    });

    logger.debug({ function: func, log: 'ended', params: { bankAccountId, featureOptions } });
    return collection.findOneAndUpdate({ _id: bankAccountId }, { $set: toSet })
        .then((response) => {
            return !!response.value;
        });
});

// consts
const consts = {
    DEFAULT_OPTIONS: Object.freeze({ allowDiskUse: true }),
    LOG_PREFIX: DBQueries.name
};

module.exports = DBQueries;
