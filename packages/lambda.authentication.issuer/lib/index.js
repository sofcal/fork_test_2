'use strict';

const JwtIssuerLambda = require('./JwtIssuerLambda');

const issuer = JwtIssuerLambda.Create({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);
