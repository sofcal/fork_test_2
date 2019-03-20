'use strict';

const JwtAuthenticatorLambda = require('./JwtAuthenticatorLambda');

const issuer = new JwtAuthenticatorLambda({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);
