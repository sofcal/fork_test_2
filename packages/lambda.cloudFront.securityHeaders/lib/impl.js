'use strict';

const Promise = require('bluebird');
const ErrorSpecs = require('./ErrorSpecs');
const { StatusCodeError } = require('@sage/bc-common-statuscodeerror');
const querystring = require('querystring');
const _ = require('underscore');

module.exports.run = Promise.method((event, params) => {
    const func = 'impl.run';
    event.logger.info({ function: func, log: 'started' });

    const response = event.Records[0].cf.response; // eslint-disable-line prefer-destructuring
    const request = event.Records[0].cf.request; // eslint-disable-line prefer-destructuring
    const headers = response.headers; // eslint-disable-line prefer-destructuring
    const query = request.querystring.toLowerCase();
    const uri = request.uri.toLowerCase();
    event.logger.info({ function: func, log: 'request', params: { request } });

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
            let headerValue = `img-src 'self' https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://s3-eu-west-1.amazonaws.com ${whitelistNoCommas}; `;
            headerValue += `script-src 'self' *.sage.com 'unsafe-inline' https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://cdnjs.cloudflare.com https://ajax.googleapis.com https://cdn.plaid.com ${whitelistNoCommas}; `;
            headerValue += `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com ${whitelistNoCommas}; `;
            headers['content-security-policy'] = [{ key: 'Content-Security-Policy', value: headerValue }];
        } else {
            headers['x-content-security-policy'] = [{ key: 'X-Content-Security-Policy', value: 'default-src \'none\'' }];
            let headerValue = 'img-src \'self\' https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://s3-eu-west-1.amazonaws.com; ';
            headerValue += 'script-src \'self\' \'unsafe-inline\' https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://cdnjs.cloudflare.com https://ajax.googleapis.com https://cdn.plaid.com; ';
            headerValue += 'style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com https://fonts.gstatic.com; ';
            headers['content-security-policy'] = [{ key: 'Content-Security-Policy', value: headerValue }];
        }
        event.logger.info({ function: func, log: 'added x-frame-options allow-from for domain', params: { xFrameOptions: headers['x-content-security-policy'][0].value } });

        event.logger.info({ function: func, log: 'query', params: { query } });
        const xFrameDomain = getQuerySegment(query, 'xframedomain');
        event.logger.info({ function: func, log: 'xFrameDomain', params: { xFrameDomain } });
        if (checkXFrameDomainInWhiteList(xFrameDomain, whitelist)) {
            // if xFrameDomain in query string and in whitelist then add allow-from
            headers['x-frame-options'] = [{ key: 'X-Frame-Options', value: `ALLOW-FROM ${xFrameDomain}` }];
            event.logger.info({ function: func, log: 'added ', params: { xFrameOptions: headers['x-frame-options'][0].value } });
        } else if (uri.includes('xframe.html')) {
            // if xFrameDomain NOT in query and page is xframe.html then add DENY
            headers['x-frame-options'] = [{ key: 'X-Frame-Options', value: 'DENY' }];
            event.logger.info({ function: func, log: 'added ', params: { xFrameOptions: headers['x-frame-options'][0].value } });
        }
    } catch (e) {
        event.logger.error({ function: func, log: 'error adding headers', params: { errorMessage: e.message } });
        throw StatusCodeError.CreateFromSpecs([ErrorSpecs.generalError], ErrorSpecs.generalError.statusCode);
    }
    event.logger.info({ function: func, log: 'ended' });
    return response;
});

const checkXFrameDomainInWhiteList = (xFrameDomain, whiteList) => {
    let exists = false;
    if (xFrameDomain) {
        const whiteListArray = whiteList.toString().split(',');
        let lowDomain = '';
        const lowXFrameDomain = xFrameDomain.toString().toLowerCase();
        _.find(whiteListArray, (domain) => {
            lowDomain = domain.toString().toLowerCase();
            const pos = lowDomain.indexOf('*.');
            if (pos > -1) {
                lowDomain = lowDomain.substring(pos + 2);
                if (lowXFrameDomain.endsWith(lowDomain)) {
                    exists = true;
                }
            } else if (lowXFrameDomain.endsWith(lowDomain)) {
                exists = true;
            }
        });
        if (lowXFrameDomain.includes(lowDomain)) {
            exists = true;
        }
    }
    return exists;
};

const getQuerySegment = (query, segment) => {
    if (query.length < 1) {
        return undefined;
    }
    const queryObj = querystring.parse(query);
    return queryObj[segment];
};
