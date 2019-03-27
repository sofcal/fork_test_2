'use strict';

const JwksLambda = require('./JwksLambda');

const issuer = JwksLambda.Create({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);