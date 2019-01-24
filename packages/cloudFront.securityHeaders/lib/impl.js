'use strict';

const Promise = require('bluebird');
const ErrorSpecs = require('./ErrorSpecs');
const { StatusCodeError } = require('internal-status-code-error');
const querystring = require('querystring');

module.exports.run = Promise.method((event, params) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });

    const response = event.Records[0].cf.response; // eslint-disable-line prefer-destructuring
    const request = event.Records[0].cf.request; // eslint-disable-line prefer-destructuring
    const headers = response.headers; // eslint-disable-line prefer-destructuring
    const query = request.querystring.toLowerCase();

    try {
        const whitelist = params['outboundApi.callbackUriWhiteList'] ? params['outboundApi.callbackUriWhiteList'] : '';
        const whitelistNoCommas = whitelist.toString().split(',').join(' ');

        // remove unwanted headers
        // Set to empty string because if I remove the default s3 server, cloudfront then adds 'CloudFront'
        headers['server'] = [{ key: 'Server', value: '' }]; // eslint-disable-line dot-notation

        // Add static security headers
        event.logger.info({ function: func, log: 'Adding static security headers' });
        headers['cache-control'] = [{ key: 'Cache-Control', value: 'public, max-age=86400, no-transform' }];
        headers['strict-transport-security'] = [{ key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' }];
        headers['referrer-policy'] = [{ key: 'Referrer-Policy', value: 'same-origin' }];
        headers['feature-policy'] = [{ key: 'Feature-Policy', value: 'geolocation \'none\'; midi \'none\'; sync-xhr \'self\'; microphone \'none\'; camera \'none\'; magnetometer \'none\'; gyroscope \'none\'; speaker \'none\'; fullscreen \'self\'; payment \'self\'' }];

        headers['x-xss-protection'] = [{ key: 'X-XSS-Protection', value: '1; mode=block' }];
        headers['x-content-type-options'] = [{ key: 'X-Content-Type-Options', value: 'nosniff' }];
        headers['x-download-options'] = [{ key: 'X-Download-Options', value: 'noopen' }];
        headers['x-permitted-cross-domain-policies'] = [{ key: 'X-Permitted-Cross-Domain-Policies', value: 'master-only' }];

        if (whitelist && whitelist !== '') {
            headers['x-content-security-policy'] = [{ key: 'X-Content-Security-Policy', value: `allow-from frame-ancestors ${whitelistNoCommas}` }];
            let headerValue = `img-src 'self' https://www.google-analytics.com https://s3-eu-west-1.amazonaws.com ${whitelistNoCommas}; `;
            headerValue += `script-src 'self' *.sage.com 'unsafe-inline' https://www.google-analytics.com https://cdnjs.cloudflare.com ${whitelistNoCommas}; `;
            headerValue += `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com ${whitelistNoCommas}; `;
            headerValue += 'report-uri slippydog.com'; // TODO: remove
            headers['content-security-policy-report-only'] = [{ key: 'Content-Security-Policy-Report-Only', value: headerValue }];
        } else {
            headers['x-content-security-policy'] = [{ key: 'X-Content-Security-Policy', value: 'default-src \'none\'' }];
            let headerValue = 'img-src \'self\' https://www.google-analytics.com https://s3-eu-west-1.amazonaws.com; ';
            headerValue += 'script-src \'self\' *.sage.com \'unsafe-inline\' https://www.google-analytics.com https://cdnjs.cloudflare.com; ';
            headerValue += 'style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; ';
            headerValue += 'report-uri slippydog.com'; // TODO: remove
            headers['content-security-policy-report-only'] = [{ key: 'Content-Security-Policy-Report-Only', value: headerValue }];
        }
        event.logger.info({ function: func, log: 'added x-frame-options allow-from for domain', params: { xFrameOptions: headers['x-content-security-policy'][0].value } });

        event.logger.info({ function: func, log: 'query', params: { query } });
        const xFrameDomain = getQuerySegment(query, 'xframedomain');
        event.logger.info({ function: func, log: 'xFrameDomain', params: { xFrameDomain } });
        if (xFrameDomain && whitelistNoCommas.toLowerCase().includes(xFrameDomain.toLowerCase())) {
            // if xFrameDomain in query string and in whitelist then add allow-from
            headers['x-frame-options'] = [{ key: 'X-Frame-Options', value: `ALLOW-FROM ${xFrameDomain}` }];
        } else {
            // if xFrameDomain NOT in query string then add DENY
            headers['x-frame-options'] = [{ key: 'X-Frame-Options', value: 'DENY' }];
        }
        event.logger.info({ function: func, log: 'added ', params: { xFrameOptions: headers['x-frame-options'][0].value } });
    } catch (e) {
        event.logger.error({ function: func, log: 'error adding headers', params: { errorMessage: e.message } });
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.generalError], ErrorSpecs.generalError.statusCode);
    }

    event.logger.info({ function: func, log: 'ended' });
    return response;
});

const getQuerySegment = (query, segment) => {
    const queryObj = querystring.parse(query);
    return queryObj[segment];
};
