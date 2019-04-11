'use strict';

const AuthServiceJwksLambda = require('./AuthServiceJwksLambda');

const issuer = AuthServiceJwksLambda.Create({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);
