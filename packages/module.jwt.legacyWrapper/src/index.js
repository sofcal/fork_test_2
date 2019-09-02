'use strict';

const { Rule, RuleBucket } = require('@sage/bc-contracts-rule');
const { PredictedAction } = require('@sage/bc-contracts-predictedaction');

const { Mapper: StatusCodeErrorMapper } = require('@sage/bc-jsonschema-to-statuscodeerror');
const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-statuscodeerror');

const Authenticator = require('@sage/sfab-s2s-jwt-authenticator');
const Cache = require('@sage/sfab-s2s-jwt-cache');
const EndpointStore = require('@sage/sfab-s2s-jwt-endpoint-store');
const Issuer = require('@sage/sfab-s2s-jwt-issuer');
const Jwks = require('@sage/sfab-s2s-jwt-jwks');
const Kid = require('@sage/sfab-s2s-jwt-kid');
const Parameter = require('@sage/bc-services-parameter');
const Step = require('@sage/bc-services-step');
const ClamAVWorkers = require('@sage/sfab-workers-clam-av');

module.exports = {
    common: { StatusCodeErrorItem, StatusCodeError, StatusCodeErrorMapper },
    contracts: { PredictedAction, Rule, RuleBucket },
    Authenticator,
    Cache,
    EndpointStore,
    Issuer,
    Jwks,
    Kid,
    Parameter,
    Step,
    ClamAVWorkers
};
