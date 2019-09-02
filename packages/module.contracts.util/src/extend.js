'use strict';

const _ = require('underscore');

/**
 * API Util function for extending contract objects on the API. Ensures the source object only contains keys which are allowed
 *  on the destination type. If readOnlyKeys are also provided, the destination is also filtered to remove any keys non in
 *  that array
 * @param destination [required]: Object that represents the current state of a stored contract. This would be the value retrieved from DB
 * @param source [required]: Object that represents the desired state of the contract. This would be the value coming in from the API
 * @param sourceWhitelist: Collection of key names which represents allowable fields on the object. If provided, the source is filtered
 * to ensure only allowable fields can be updated
 * @param destinationWhitelist: Collection of key names which represent readOnly properties. If provided, the destination is filtered
 *  to only contain these readOnly keys - meaning any other required field MUST be provided on the source to ensure the object
 *  validates
 * @returns {any | *}
 */
module.exports = ({ destination, source, sourceWhitelist = null, destinationWhitelist = null } = {}) => {
    // filter any value from the source that isn't in keys - this allows us to limit source to ONLY those values we have
    //  whitelisted in the 'keys' list
    const filteredSource = sourceWhitelist ? _.pick(source, sourceWhitelist) : source;

    // if we're only interested in keeping the readonly fields, we need to strip all other fields from the destination object.
    // That way if they're not provided on the source, the object won't validate.
    const filteredDestination = destinationWhitelist ? _.pick(destination, destinationWhitelist) : destination;

    return _.extendOwn({}, filteredDestination, filteredSource);
};
