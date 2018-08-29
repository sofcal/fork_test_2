'use strict';

const _ = require('underscore');
const util = require('util');
const StatusCodeErrorItem = require('./StatusCodeErrorItem');

/**
 * Creates an instance of the StatusCodeErrorItem
 * @memberof _Infrastructure._Common
 * @class
 * @type {Function}
 * @constructs StatusCodeError
 * @classdesc Stores a collection of StatusCodeErrorItem and an associated statusCode. This class follows the same
 *  format as the ApplicationError framework class and can therefore be easily mapped to it. The intent is to allow an
 *  abstraction from the ApplicationError that allows easy recognition of errors that should or should not be
 *  returned to the API caller (StatusCodeError gets mapped to an ApplicationError, Error gets hidden behind a default
 *  500 ApplicationError)
 * @description Creates an instance of the StatusCodeErrorItem with the given message and optional params object
 * @param {_Infrastructure._Common.StatusCodeErrorItem[]} items At least one error item
 * @param {Number} statusCode The status code for this error
 * @param {string=} stack Existing stack trace to use for this error
 * @returns {StatusCodeError}
 * @see {@link _Infrastructure._Common.StatusCodeErrorItem|StatusCodeErrorItem}
 *
 * @example
 * <pre>
 *     throw new StatusCodeError([new StatusCodeErrorItem('desc', {})], 400);
 * </pre>
 */
function StatusCodeError(items, statusCode, stack) {
    StatusCodeError.super_.call(this);

    this.name = this.constructor.name;
    this.items = items;
    this.statusCode = statusCode;

    if(stack){
        this.stack = stack;
    } else {
        Error.captureStackTrace(this, this.constructor);
        this.stack = this.stack.replace(this.name, this.name + ': ' + JSON.stringify({ items: items, statusCode: statusCode }));
    }
}

util.inherits(StatusCodeError, Error);

StatusCodeError.create = (specs, statusCode, stack) => {
    const items = _.map(specs, (spec) => new StatusCodeErrorItem(spec.applicationCode, spec.message, spec.params));
    return new StatusCodeError(items, statusCode, stack);
};

/**
 * @type {_Infrastructure._Common.StatusCodeError}
 */
module.exports = StatusCodeError;