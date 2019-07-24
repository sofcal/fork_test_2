'use strict';

const { CertificateRotationLambda } = require('@sage/sfab-s2s-jwt-certificaterotation-lambda');

const issuer = CertificateRotationLambda.Create({ config: process.env });
module.exports.run = (event, context, callback) => issuer.run(event, context, callback);
