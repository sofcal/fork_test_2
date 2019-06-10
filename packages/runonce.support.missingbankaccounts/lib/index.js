'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');
const MissingBankAccountsLambda = require('./MissingBankAccountsLambda');

AWS.config.setPromisesDependency(Promise);

const issuer = MissingBankAccountsLambda.Create({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);
