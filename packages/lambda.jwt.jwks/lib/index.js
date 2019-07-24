'use strict';

const { JwksLambda } = require('@sage/sfab-s2s-jwt-jwks-lambda');

const issuer = JwksLambda.Create({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);
