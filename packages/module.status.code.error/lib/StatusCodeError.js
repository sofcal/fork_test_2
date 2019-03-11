'use strict';

const StatusCodeErrorItem = require('./StatusCodeErrorItem');

const _ = require('underscore');

class StatusCodeError extends Error {
  constructor(items, statusCode, stack) {
    super();
    this.name = this.constructor.name;
    this.items = items;
    this.statusCode = statusCode;

    if (stack) {
      this.stack = stack;
    }
  }

  toDiagnoses() {
    return {
      $diagnoses: _.map(this.items, item => ({
        $applicationCode: item.applicationCode,
        $message: item.message,
        $sdataCode: 'ApplicationDiagnosis',
        $severity: 'Error'
      }))
    };
  }

  static Create(...args) {
    return new StatusCodeError(...args);
  }

  static CreateFromSpecs(specs, statusCode, stack) {
    const items = _.map(specs, spec => StatusCodeErrorItem.Create(spec.applicationCode, spec.message, spec.params));

    return new StatusCodeError(items, statusCode, stack);
  }

  static is(error) {
    return error instanceof StatusCodeError;
  }

}

module.exports = StatusCodeError;