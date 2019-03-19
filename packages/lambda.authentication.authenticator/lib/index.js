'use strict';

const JwtAuthenticatorLambda = require('./JwtAuthenticatorLambda');

const issuer = new JwtAuthenticatorLambda();
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);
