'use strict';

const _ = require('underscore');

/**
 * API Util function for deleting properties from a contract object which should not be returned from the API
 * @param source [required]: Object that represents the current state of a stored contract. This would be the value retrieved from DB
 * @param sourceBlacklist: Collection of key names which represents fields on the object that should be removed. If provided, the
 * source is filtered to ensure these fields are removed
 * @returns {any | *}
 */
module.exports = ({ source, sourceBlacklist = null } = {}) => {
    // filter any value from the source that is in keys
    return sourceBlacklist ? _.omit(source, sourceBlacklist) : source;
};
