'use strict';

// project
const pipelines = require('./pipelines');

// internal modules

// external modules
const Promise = require('bluebird');

class DBQueries {
    constructor({ db }) {
        this.db = db;
        this.pipelines = pipelines;
    }

    ruleWildcards(...args) {
        return ruleWildcardsImpl(this, ...args);
    }
}

const ruleWildcardsImpl = Promise.method((self, { all = false }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.wildcards`;
    logger.debug({ function: func, log: 'started', params: { all } });

    const collection = self.db.collection('Rule');
    const pipeline = self.pipelines.ruleWildcards();

    const promise = collection.aggregate(pipeline, consts.DEFAULT_OPTIONS);

    if (!all) {
        logger.debug({ function: func, log: 'ended - all not specified, returning cursor', params: { all } });
        return promise;
    }

    logger.debug({ function: func, log: 'WARNING: requesting all results without a cursor could present a performance issue', params: { all } });
    logger.debug({ function: func, log: 'ended - all specified; returning entire array', params: { all } });
    return promise.toArray();
});

// consts
const consts = {
    DEFAULT_OPTIONS: Object.freeze({ allowDiskUse: true, readPreference: 'secondary' }),
    LOG_PREFIX: DBQueries.name
};

module.exports = DBQueries;
