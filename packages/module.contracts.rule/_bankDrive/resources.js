/**
 * Resource object for the application. Contains common error strings, base endpoints, and any other localisable or
 *  otherwise shared resources.
 * @typedef {Object} _Infrastructure._Common.Resources
 * @property {{String}} endpoints Shared endpoints used within the application
 * @property {{String}} api Strings relevant to the API, such as headers and applicationCodes
 * @property {{String}} services Information and Error strings used by the application services
 * @property {{String}} providers Information and Error strings used by the provider adapters
 * @property {{String}} phase Combined with phaseDetails, these are used to determine whether or not a request can be
 *  processed by a given adapter
 * @property {{String}} odata Information and error strings for use with OData query parameters
 * @property {{}} regex for validating database contracts
 * @property {String} phaseDetails Combined with phase, these are used to determine whether or not a request can be
 *  processed by a given adapter
 */

/**
 * @type {_Infrastructure._Common.Resources}
 */
module.exports = (function() {
    /**
     * @type {_Infrastructure._Common.Resources}
     */
    const ns = {};

    ns.services = {
        common: {
            UnknownErrorCode: 'UnknownErrorCode',
            InvalidType: 'InvalidType',
            InvalidProperties: 'InvalidProperties',
            InvalidPropertiesFormat: '%s.%s: %s',
            MissingArrayItemFormat: '%s collection must have an item with %s of %s',
            MultipleUnfilledBuckets: 'multiple unfilled buckets'
        }
    }
    Object.freeze(ns);
    return ns;
}());
