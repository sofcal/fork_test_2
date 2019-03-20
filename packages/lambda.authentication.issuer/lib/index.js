'use strict';

const JwtIssuerLambda = require('./JwksIssuerLambda');

const issuer = new JwtIssuerLambda({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);
