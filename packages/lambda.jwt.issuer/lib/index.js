'use strict';

const AWS = require('aws-sdk');
const Promise = require('bluebird');
const { JwtIssuerLambda } = require('@sage/sfab-s2s-jwt-issuer-lambda');

AWS.config.setPromisesDependency(Promise);

const issuer = JwtIssuerLambda.Create({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);
