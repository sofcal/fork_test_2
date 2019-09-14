'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');
const CheckAggregatorSuccessLambda = require('./CheckAggregatorSuccessLambda');

AWS.config.setPromisesDependency(Promise);

const issuer = CheckAggregatorSuccessLambda.Create({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);
