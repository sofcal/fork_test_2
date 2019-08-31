'use strict';

const _ = require('underscore');

/**
 * API Util function for deleting properties from a contract object which should not be returned from the API
 * @param source [required]: Object that represents the current state of a stored contract. This would be the value retrieved from DB
 * @param sourceBlacklist: Collection of key names which represents fields on the object that should allowed. If provided, the
 * source is filtered to ensure only these fields are returned
 * @returns {any | *}
 */
module.exports = ({ source, sourceBlacklist = null } = {}) => {
    // pick any value from the source that is in whitelist
    return sourceBlacklist ? _.omit(source, sourceBlacklist) : source;
};
