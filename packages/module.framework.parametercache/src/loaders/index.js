'use strict';

const EnvironmentLoader = require('./EnvironmentLoader');
const ParameterStoreDynamicLoader = require('./ParameterStoreDynamicLoader');
const ParameterStoreStaticLoader = require('./ParameterStoreStaticLoader');

module.exports = Object.freeze({
    EnvironmentLoader, ParameterStoreDynamicLoader, ParameterStoreStaticLoader
});
