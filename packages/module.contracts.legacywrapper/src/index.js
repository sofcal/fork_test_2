'use strict';

const validators = require('@sage/bc-validators');
const resources = require('@sage/bc-common-resources');
const statusCodeError = require('@sage/bc-statuscodeerror');
const adapterresources = require('@sage/bc-adapterresources');
const alerttypes = require('@sage/bc-alerttypes');
const bankids = require('@sage/bc-bankids');
const productids = require('@sage/bc-productids');
const servicenames = require('@sage/bc-servicenames');
const rule = require('@sage/bc-rule');

module.exports = {
    validators,
    resources,
    statusCodeError,
    adapterresources,
    alerttypes,
    bankids,
    productids,
    servicenames,
    rule,
};
