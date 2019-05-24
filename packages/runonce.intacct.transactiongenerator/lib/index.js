'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');
const CreateTransactionsLambda = require('./CreateTransactionsLambda');

AWS.config.setPromisesDependency(Promise);

const issuer = CreateTransactionsLambda.Create({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);
