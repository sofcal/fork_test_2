'use strict';

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));

class SSM {
    constructor({ region = 'us-east-1', path }) {
        this.region = region;
        this.path = path;
        this.parsed = null;
    }

    getParametersByPathAsync(...args) {
        return getParametersByPathAsyncImpl(this, ...args)
    }

    getParametersAsync(...args) {
        return getParametersAsyncImpl(this, ...args)
    }
}

const getParametersByPathAsyncImpl = Promise.method((self, options) => {
    const prefix = options.Path;
    return getParams(self, options, (key) => (!prefix || key.indexOf(prefix) === 0));
});

const getParametersAsyncImpl = Promise.method((self, options) => {
    const names = options.Names || [];
    return getParams(self, options, (key) => names.indexOf(key) !== -1);
});

const getParams = Promise.method((self, { MaxResults:max = 10, NextToken }, accept) => {
    const next = NextToken ? Buffer.from(NextToken, 'base64').toString('utf-8') : null;
    const response = { Parameters: [] };

    return loadFile(self)
        .then((parsed) => {
            if(!parsed[self.region]){
                return response;
            }

            const region = parsed[self.region];
            let foundNextToken = !next;
            Object.keys(region).forEach((key) => {
                const param = region[key];

                if(response.Parameters.length >= max) {
                    if(response.Parameters.length === max && !response.NextToken && accept(key)) {
                        response.NextToken = Buffer.from(key).toString('base64');
                    }

                    return;
                }

                if(next && key === next) {
                    foundNextToken = true;
                }

                if(foundNextToken && accept(key)) {
                    response.Parameters.push(Object.assign({}, param, { Name: key }));
                }
            })
        })
        .then(() => response);
});

const loadFile = Promise.method((self) => {
    if(self.parsed) {
        return self.parsed;
    }

    return fs.readFileAsync(self.path, 'utf-8')
        .then((file) => (self.parsed = JSON.parse(file)));
});

module.exports = SSM;