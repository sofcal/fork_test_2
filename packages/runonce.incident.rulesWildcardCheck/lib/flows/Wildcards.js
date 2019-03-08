// project
const ErrorSpecs = require('../ErrorSpecs');

// internal modules
const { StatusCodeError } = require('@sage/bc-status-code-error');

// external modules
const Promise = require('bluebird');
const _ = require('underscore');

class Wildcards {
    constructor(queries) {
        this.queries = queries;
    }

    run(...args) {
        return runImpl(this, ...args);
    }
}

const runImpl = Promise.method((self, { }, { logger }) => {
    const func = `${consts.LOG_PREFIX}.run`;
    logger.info({ function: func, log: 'started', params: { } });

    logger.info({ function: func, log: 'scanning rules collection for multiple wildcard usage', params: { } });
    return self.queries.ruleWildcards({ all: true }, { logger })
        .then((results) => {
            logger.info({ function: func, log: 'retrieved results', params: { count: (results || []).length } });

            return results;
        });
});

const consts = {
    LOG_PREFIX: Wildcards.name
};

module.exports = Wildcards;
