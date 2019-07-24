'use strict';

const { JwtAuthenticatorLambda } = require('@sage/sfab-s2s-jwt-authenticator-lambda');

const issuer = JwtAuthenticatorLambda.Create({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);

