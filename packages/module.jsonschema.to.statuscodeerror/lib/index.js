'use strict';

const {
  StatusCodeError,
  StatusCodeErrorItem
} = require('@sage/bc-status-code-error');

const access = require('safe-access');

const _ = require('underscore');

const _s = require('underscore.string'); // currently, this conversion mimics the behaviour of Banking Cloud validation. We are looking to update the validation
//  messages seen by consuming client applications, but until we do that we need to preserve the responses they saw previously


const toStatusCodeErrorItems = (result, Type, obj) => {
  return _.map(result.errors, err => {
    const property = err.property.replace(`${Type.name}.`, '');

    const splits = _s.words(property, '.');

    const treatAsArray = _.find(_.last(splits, 2), split => _s.endsWith(split, ']'));

    const trimmedProperty = _s.strLeft(err.property, '[');

    const trimmedValueKey = treatAsArray ? `${_s.strLeft(property, ']')}]` : property;

    const trimmedParamKey = _s.strLeft(property, '[');

    const value = access(obj, trimmedValueKey);
    const params = {};
    params[trimmedParamKey] = value;
    return StatusCodeErrorItem.Create('InvalidProperties', `${trimmedProperty}: ${value}`, params);
  });
};

const toStatusCodeError = (result, Type, obj) => {
  if (!result.errors || !result.errors.length) {
    return null;
  }

  return StatusCodeError.Create(toStatusCodeErrorItems(result, Type, obj), 400);
};

module.exports = {
  toStatusCodeErrorItems,
  toStatusCodeError
};