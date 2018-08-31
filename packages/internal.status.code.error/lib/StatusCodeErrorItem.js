'use strict';

class StatusCodeErrorItem {
  constructor(code, message, params) {
    this.applicationCode = code;
    this.message = message;
    this.params = params;
  }

  static Create(...args) {
    return new StatusCodeErrorItem(...args);
  }

}

module.exports = StatusCodeErrorItem;