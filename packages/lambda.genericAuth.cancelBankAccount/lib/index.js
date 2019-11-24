'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');

const GenericAuthPostBankAccountLambda = require('./GenericAuthCancelBankAccountLambda');

// set AWS to use bluebird promises - this ensures we have access to finally blocks and other useful tools
AWS.config.setPromisesDependency(Promise);

// call into our implementation to perform the work. This instance will exist for the lifespan of this lambda. Passing
// process.env here ensures we don't have to reference it within our implementation, making testing easier
const issuer = GenericAuthPostBankAccountLambda.Create({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);
