'use strict';

/**
 * Creates an instance of the StatusCodeErrorItem
 * @memberof _Infrastructure._Common
 * @class
 * @constructs StatusCodeErrorItem
 * @classdesc A class for holding information about an error. The params object allows the tracking of the function
 *  parameters that caused the error, but should not be used to store large objects.
 * @description Creates an instance of the StatusCodeErrorItem with the given message and optional params object
 * @param {string} code The applicationCode for this error
 * @param {string} message The message for this error
 * @param {object} [params] The parameters that caused this error to occur
 * @see {@link _Infrastructure._Common.StatusCodeError|StatusCodeError}
 */
function StatusCodeErrorItem(code, message, params) {
    this.applicationCode = code;
    this.message = message;
    this.params = params;
}

/**
 *
 * @type {_Infrastructure._Common.StatusCodeErrorItem}
 */
module.exports = StatusCodeErrorItem;