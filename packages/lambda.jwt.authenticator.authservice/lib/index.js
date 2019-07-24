'use strict';

const AuthServiceJwtLambda = require('./AuthServiceJwtLambda');

const issuer = AuthServiceJwtLambda.Create({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);

