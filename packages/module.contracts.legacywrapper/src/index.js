'use strict';

const validators = require('@sage/bc-validators');
const Resources = require('@sage/bc-common-resources');
const statusCodeError = require('@sage/bc-statuscodeerror');
const AdapterResources = require('@sage/bc-adapterresources');
const AlertTypes = require('@sage/bc-alerttypes');
const bankIds = require('@sage/bc-bankids');
const ProductIds = require('@sage/bc-productids');
const ServiceNames = require('@sage/bc-servicenames');
const Rule = require('@sage/bc-rule');
const Queries = require('@sage/bc-queries');

module.exports = {
    validators,
    Resources,
    statusCodeError,
    AdapterResources,
    AlertTypes,
    bankIds,
    ProductIds,
    ServiceNames,
    Rule,
    Queries
};
