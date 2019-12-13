'use strict';

const { CloudIdAuthenticatorLambda } = require('@sage/sfab-s2s-cloudid-authenticator-lambda');

const issuer = CloudIdAuthenticatorLambda.Create({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);

