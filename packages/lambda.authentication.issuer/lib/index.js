'use strict';

const JwtIssuerLambda = require('./JwtIssuerLambda');

const issuer = new JwtIssuerLambda({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);
