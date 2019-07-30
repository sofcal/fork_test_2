const should = require('should');
const sinon = require('sinon');
const impl = require('./../../lib/impl.js');

describe('impl', function(){
    let sandbox;
    const whiteList = 'https://*.eu.sageone.com,https://*.na.sageone.com,https://*.sageone.biz,https://*.sage.com,https://https://*.intacct.com,https://addons.lvh.me';
    const whiteListNoCommas = whiteList.split(',').join(' ');

    before(()=>{
    });

    after(()=> {
    });

    beforeEach(()=>{
        sandbox = sinon.createSandbox();
    });

    afterEach(()=>{
        sandbox.restore();
    });

    it('should add static headers', () => {
        const logFunc = (data) => {console.log(JSON.stringify(data))};
        const expectedHeaders = {
            'cache-control': [{ key: 'Cache-Control', value: 'public, max-age=86400, no-transform' }],
            'strict-transport-security': [{ key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' }],
            'x-content-security-policy': [{ key: 'X-Content-Security-Policy', value: `allow-from frame-ancestors ${whiteListNoCommas}` }],
            'content-security-policy': [{ key: 'Content-Security-Policy', value: `img-src 'self' https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://s3-eu-west-1.amazonaws.com ${whiteListNoCommas}; script-src 'self' *.sage.com 'unsafe-inline' https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://cdnjs.cloudflare.com https://ajax.googleapis.com https://cdn.plaid.com ${whiteListNoCommas}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com ${whiteListNoCommas}; `}],
            'x-xss-protection': [{ key: 'X-XSS-Protection', value: '1; mode=block' }],
            'x-content-type-options': [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
            'x-download-options': [{ key: 'X-Download-Options', value: 'noopen' }],
            'x-permitted-cross-domain-policies': [{ key: 'X-Permitted-Cross-Domain-Policies', value: 'master-only' }],
            'server': [{ key: 'Server', value: '' }],
            'feature-policy': [{ key: 'Feature-Policy', value: 'geolocation \'none\'; midi \'none\'; sync-xhr \'self\'; microphone \'none\'; camera \'none\'; magnetometer \'none\'; gyroscope \'none\'; speaker \'none\'; fullscreen \'self\'; payment \'self\'' }],
            'referrer-policy': [{ key: 'Referrer-Policy', value: 'same-origin' }]
        };
        const htmlBody = '<HEAD/><BODY>Test</BODY>';
        const bodyString = JSON.stringify(htmlBody);
        const event = {
            logger: {info: logFunc, error: logFunc},
            Records: [{
                cf: {
                    request: {
                        uri: 'https://www.test.com/banking/dosomething',
                        querystring: ''
                    },
                    response: {
                        headers: {},
                        body: bodyString
                    }
                }
            }]
        };
        let params = {};
        params['outboundApi.callbackUriWhiteList'] = whiteList;

        return impl.run(event, params)
            .then(()=>{
                const headers = event.Records[0].cf.response.headers;
                should(headers).eql(expectedHeaders);
            })
    });

    it('should add the x-frame-options-allow-from if the query string contains a wildcard domain in the whitelist', () => {
        const logFunc = (data) => {console.log(JSON.stringify(data))};
        const expectedHeaders = {
            'cache-control': [{ key: 'Cache-Control', value: 'public, max-age=86400, no-transform' }],
            'strict-transport-security': [{ key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' }],
            'x-content-security-policy': [{ key: 'X-Content-Security-Policy', value: `allow-from frame-ancestors ${whiteListNoCommas}` }],
            'content-security-policy': [{ key: 'Content-Security-Policy', value: `img-src 'self' https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://s3-eu-west-1.amazonaws.com ${whiteListNoCommas}; script-src 'self' *.sage.com 'unsafe-inline' https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://cdnjs.cloudflare.com https://ajax.googleapis.com https://cdn.plaid.com ${whiteListNoCommas}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com ${whiteListNoCommas}; `}],
            'x-xss-protection': [{ key: 'X-XSS-Protection', value: '1; mode=block' }],
            'x-content-type-options': [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
            'x-download-options': [{ key: 'X-Download-Options', value: 'noopen' }],
            'x-permitted-cross-domain-policies': [{ key: 'X-Permitted-Cross-Domain-Policies', value: 'master-only' }],
            'x-frame-options': [{ key: 'X-Frame-Options', value: 'ALLOW-FROM https://pre-addons.na.sageone.com' }],
            'server': [{ key: 'Server', value: '' }],
            'feature-policy': [{ key: 'Feature-Policy', value: 'geolocation \'none\'; midi \'none\'; sync-xhr \'self\'; microphone \'none\'; camera \'none\'; magnetometer \'none\'; gyroscope \'none\'; speaker \'none\'; fullscreen \'self\'; payment \'self\'' }],
            'referrer-policy': [{ key: 'Referrer-Policy', value: 'same-origin' }]
        };

        const htmlBody = '<HEAD/><BODY>Test</BODY>';
        const bodyString = JSON.stringify(htmlBody);
        const event = { logger: { info: logFunc, error: logFunc }, Records: [{ cf: { request: { uri: 'https://www.test.com' ,querystring: 'xframedomain=https://pre-addons.na.sageone.com'}, response: { headers: {}, body: bodyString } }}]};
        let params = {};
        params['outboundApi.callbackUriWhiteList'] = whiteList;

        return impl.run(event, params)
            .then(()=>{
                const headers = event.Records[0].cf.response.headers;
                should(headers).eql(expectedHeaders);
            })
    });

    it('should add the x-frame-options-allow-from if the query string contains a non wildcard domain in the whitelist', () => {
        const logFunc = (data) => {console.log(JSON.stringify(data))};
        const expectedHeaders = {
            'cache-control': [{ key: 'Cache-Control', value: 'public, max-age=86400, no-transform' }],
            'strict-transport-security': [{ key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' }],
            'x-content-security-policy': [{ key: 'X-Content-Security-Policy', value: `allow-from frame-ancestors ${whiteListNoCommas}` }],
            'content-security-policy': [{ key: 'Content-Security-Policy', value: `img-src 'self' https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://s3-eu-west-1.amazonaws.com ${whiteListNoCommas}; script-src 'self' *.sage.com 'unsafe-inline' https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://cdnjs.cloudflare.com https://ajax.googleapis.com https://cdn.plaid.com ${whiteListNoCommas}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com ${whiteListNoCommas}; `}],
            'x-xss-protection': [{ key: 'X-XSS-Protection', value: '1; mode=block' }],
            'x-content-type-options': [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
            'x-download-options': [{ key: 'X-Download-Options', value: 'noopen' }],
            'x-permitted-cross-domain-policies': [{ key: 'X-Permitted-Cross-Domain-Policies', value: 'master-only' }],
            'x-frame-options': [{ key: 'X-Frame-Options', value: 'ALLOW-FROM https://addons.lvh.me' }],
            'server': [{ key: 'Server', value: '' }],
            'feature-policy': [{ key: 'Feature-Policy', value: 'geolocation \'none\'; midi \'none\'; sync-xhr \'self\'; microphone \'none\'; camera \'none\'; magnetometer \'none\'; gyroscope \'none\'; speaker \'none\'; fullscreen \'self\'; payment \'self\'' }],
            'referrer-policy': [{ key: 'Referrer-Policy', value: 'same-origin' }]
        };

        const htmlBody = '<HEAD/><BODY>Test</BODY>';
        const bodyString = JSON.stringify(htmlBody);
        const event = { logger: { info: logFunc, error: logFunc }, Records: [{ cf: { request: { uri: 'https://www.test.com' ,querystring: 'xframedomain=https://addons.lvh.me'}, response: { headers: {}, body: bodyString } }}]};
        let params = {};
        params['outboundApi.callbackUriWhiteList'] = whiteList;

        return impl.run(event, params)
            .then(()=>{
                const headers = event.Records[0].cf.response.headers;
                should(headers).eql(expectedHeaders);
            })
    });

    it('should add the x-frame-options-deny if the query string does not contain a domain in the whitelist and the uri contains xframe.html', () => {
        const logFunc = (data) => {console.log(JSON.stringify(data))};
        const expectedHeaders = {
            'cache-control': [{ key: 'Cache-Control', value: 'public, max-age=86400, no-transform' }],
            'strict-transport-security': [{ key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' }],
            'x-content-security-policy': [{ key: 'X-Content-Security-Policy', value: `allow-from frame-ancestors ${whiteListNoCommas}` }],
            'content-security-policy': [{ key: 'Content-Security-Policy', value: `img-src 'self' https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://s3-eu-west-1.amazonaws.com ${whiteListNoCommas}; script-src 'self' *.sage.com 'unsafe-inline' https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://cdnjs.cloudflare.com https://ajax.googleapis.com https://cdn.plaid.com ${whiteListNoCommas}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com ${whiteListNoCommas}; `}],
            'x-xss-protection': [{ key: 'X-XSS-Protection', value: '1; mode=block' }],
            'x-content-type-options': [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
            'x-download-options': [{ key: 'X-Download-Options', value: 'noopen' }],
            'x-permitted-cross-domain-policies': [{ key: 'X-Permitted-Cross-Domain-Policies', value: 'master-only' }],
            'x-frame-options': [{ key: 'X-Frame-Options', value: 'DENY' }],
            'server': [{ key: 'Server', value: '' }],
            'feature-policy': [{ key: 'Feature-Policy', value: 'geolocation \'none\'; midi \'none\'; sync-xhr \'self\'; microphone \'none\'; camera \'none\'; magnetometer \'none\'; gyroscope \'none\'; speaker \'none\'; fullscreen \'self\'; payment \'self\'' }],
            'referrer-policy': [{ key: 'Referrer-Policy', value: 'same-origin' }]
        };
        const htmlBody = '<HEAD/><BODY>Test</BODY>';
        const bodyString = JSON.stringify(htmlBody);
        const event = { logger: { info: logFunc, error: logFunc }, Records: [{ cf: { request: { uri: 'https://www.test.com/xframe.html', querystring: 'xframedomain=https://doesnotexist.com'}, response: { headers: {}, body: bodyString } }}]};
        let params = {};
        params['outboundApi.callbackUriWhiteList'] = whiteList;

        return impl.run(event, params)
            .then(()=>{
                const headers = event.Records[0].cf.response.headers;
                should(headers).eql(expectedHeaders);
            })
    });

    it('should add the x-frame-options-deny if the query string does not contain a domain and the uri contains xframe.html', () => {
        const logFunc = (data) => {console.log(JSON.stringify(data))};
        const expectedHeaders = {
            'cache-control': [{ key: 'Cache-Control', value: 'public, max-age=86400, no-transform' }],
            'strict-transport-security': [{ key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' }],
            'x-content-security-policy': [{ key: 'X-Content-Security-Policy', value: `allow-from frame-ancestors ${whiteListNoCommas}` }],
            'content-security-policy': [{ key: 'Content-Security-Policy', value: `img-src 'self' https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://s3-eu-west-1.amazonaws.com ${whiteListNoCommas}; script-src 'self' *.sage.com 'unsafe-inline' https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://cdnjs.cloudflare.com https://ajax.googleapis.com https://cdn.plaid.com ${whiteListNoCommas}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com ${whiteListNoCommas}; `}],
            'x-xss-protection': [{ key: 'X-XSS-Protection', value: '1; mode=block' }],
            'x-content-type-options': [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
            'x-download-options': [{ key: 'X-Download-Options', value: 'noopen' }],
            'x-permitted-cross-domain-policies': [{ key: 'X-Permitted-Cross-Domain-Policies', value: 'master-only' }],
            'x-frame-options': [{ key: 'X-Frame-Options', value: 'DENY' }],
            'server': [{ key: 'Server', value: '' }],
            'feature-policy': [{ key: 'Feature-Policy', value: 'geolocation \'none\'; midi \'none\'; sync-xhr \'self\'; microphone \'none\'; camera \'none\'; magnetometer \'none\'; gyroscope \'none\'; speaker \'none\'; fullscreen \'self\'; payment \'self\'' }],
            'referrer-policy': [{ key: 'Referrer-Policy', value: 'same-origin' }]
        };
        const htmlBody = '<HEAD/><BODY>Test</BODY>';
        const bodyString = JSON.stringify(htmlBody);
        const event = { logger: { info: logFunc, error: logFunc }, Records: [{ cf: { request: { uri: 'https://www.test.com/xframe.html' ,querystring: 'dummy=dummy'}, response: { headers: {}, body: bodyString } }}]};
        let params = {};
        params['outboundApi.callbackUriWhiteList'] = whiteList;

        return impl.run(event, params)
            .then(()=>{
                const headers = event.Records[0].cf.response.headers;
                should(headers).eql(expectedHeaders);
            })
    });

    it('should return the body unchanged', () => {
        const logFunc = (data) => {console.log(JSON.stringify(data))};

        const htmlBody = '<HEAD/><BODY>Test</BODY>';
        const bodyString = JSON.stringify(htmlBody);
        const event = { logger: { info: logFunc, error: logFunc }, Records: [{ cf: { request: { uri: 'https://www.test.com' ,querystring: ''}, response: { headers: {}, body: bodyString } }}]};
        let params = {};
        params['outboundApi.callbackUriWhiteList'] = whiteList;


        return impl.run(event, params)
            .then(()=>{
                const body = event.Records[0].cf.response.body;
                should(body).eql(bodyString);
            })
    });

    it('should throw if an error is thrown', () => {
        const logFunc = (data) => {console.log(JSON.stringify(data))};
        let thrown = false;

        const htmlBody = '<HEAD/><BODY>Test</BODY>';
        const bodyString = JSON.stringify(htmlBody);
        const event = { logger: { info: logFunc, error: logFunc }, Records: [{ cf: { request: { uri: 'https://www.test.com' ,querystring: ''}, response: { headers: {}, body: bodyString } }}]};
        const params = undefined;

        return impl.run(event, params)
            .then(()=>{
            })
            .catch((err) => {
                should(err.items[0].message).eql('an error occurred adding headers');
                should(err.statusCode).eql(400);
                thrown = true;
            })
            .finally(() => {
                should(thrown).eql(true);
            })
    });

    it('should write logs', () => {
        const logs = [];
        const expexctedLogs = [
            '{"function":"impl.run","log":"started"}',
            '{"function":"impl.run","log":"request","params":{"request":{"uri":"https://www.test.com/xframe.html","querystring":""}}}',
            '{"function":"impl.run","log":"Adding static security headers"}',
            '{"function":"impl.run","log":"added x-frame-options allow-from for domain","params":{"xFrameOptions":"default-src \'none\'"}}',
            '{"function":"impl.run","log":"query","params":{"query":""}}',
            '{"function":"impl.run","log":"xFrameDomain","params":{}}',
            '{"function":"impl.run","log":"added ","params":{"xFrameOptions":"DENY"}}',
            '{"function":"impl.run","log":"ended"}'
        ];
        const logFunc = (data) => { logs.push(JSON.stringify(data)) };

        const htmlBody = '<HEAD/><BODY>Test</BODY>';
        const bodyString = JSON.stringify(htmlBody);
        const event = { logger: { info: logFunc, error: logFunc }, Records: [{ cf: { request: { uri: 'https://www.test.com/xframe.html' ,querystring: ''}, response: { headers: {}, body: bodyString } }}]};
        let params = {};

        return impl.run(event, params)
            .then(()=>{
                should(logs).eql(expexctedLogs);
            })
    });

});
