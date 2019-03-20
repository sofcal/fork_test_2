'use strict';

const JwksLambda = require('./JwksLambda');

const issuer = new JwksLambda({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);