'use strict';

const Rule = require('@sage/bc-contracts-rule');

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
    contracts: { Rule },
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
