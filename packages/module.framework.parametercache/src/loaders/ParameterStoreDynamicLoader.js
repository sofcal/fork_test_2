'use strict';

const Promise = require('bluebird');
const AWS = require('aws-sdk');

class ParameterStoreDynamicLoader {
    constructor({ paramPrefix = null, env: { region } = {}, ssm }) {
        if (!region) {
            throw new Error('[ParameterStoreDynamicLoader] invalid region');
        }

        this.ssm = ssm || Promise.promisifyAll(new AWS.SSM({ region }));

        this.paramPrefix = paramPrefix;
    }

    load(params) {
        // loadImpl allows us to ensure the code is wrapped in a promise
        return loadImpl(this, params);
    }
}
ParameterStoreDynamicLoader.MaxResults = 10;

// prioritise getByList if a parameter list is provided
const loadImpl = Promise.method((self, params) => {
    const prefix = self.paramPrefix;

    // aws sdk limits to page size of 10, so need a recursive function
    // WARNING: recursive promise calls are only suitable for low recursion values
    const pageAll = async(next = null) => { // eslint-disable-line consistent-return
        const options = {
            Path: prefix,
            MaxResults: ParameterStoreDynamicLoader.MaxResults,
            Recursive: true,
            WithDecryption: true,
            NextToken: next
        };

        const response = await self.ssm.getParametersByPathAsync(options);

        mapResponse(params, response, prefix);

        // a NextToken is provided if there are more results to retrieve, we use it for paging
        if (response.NextToken) {
            return pageAll(params, response.NextToken);
        }
    };

    // kick off the recursion
    return pageAll(params);
});

const mapResponse = (params, response, prefix) => {
    for (let p of response.Parameters) {
        const name = p.Name.substring(prefix ? prefix.length : 0);
        params[name] = p.Type === 'StringList' ? p.Value.split(',') : p.Value;
    }
};

module.exports = ParameterStoreDynamicLoader;