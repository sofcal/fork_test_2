'use strict';

// Common
const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-common-statuscodeerror');
const resources = require('@sage/bc-common-resources');
const UncappedQuery = require('@sage/bc-common-uncappedquery');
const { Mapper: StatusCodeErrorMapper } = require('@sage/bc-jsonschema-to-statuscodeerror');

// Contracts
const { Rule, RuleBucket } = require('@sage/bc-contracts-rule');
const { PredictedAction } = require('@sage/bc-contracts-predictedaction');
const { Transaction, TransactionBucket } = require('@sage/bc-contracts-transaction');
const Lock = require('@sage/bc-contracts-lock');
const QuarantineBucket = require('@sage/bc-contracts-quarantine');
const Bank = require('@sage/bc-contracts-bank');

// Services
const validators = require('@sage/bc-services-validators');

// Processing
const { RulesEngine } = require('@sage/bc-processing-rules');

// Other
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
    common: { StatusCodeErrorItem, StatusCodeError, StatusCodeErrorMapper, resources, UncappedQuery },
    contracts: { PredictedAction, Rule, RuleBucket, Transaction, TransactionBucket, Lock, QuarantineBucket, Bank },
    services: { validators },
    processing: { RulesEngine },
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
