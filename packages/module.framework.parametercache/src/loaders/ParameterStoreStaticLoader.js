'use strict';

const Promise = require('bluebird');
const AWS = require('aws-sdk');

AWS.config.setPromiseDependency(require('bluebird'));

class ParameterStoreStaticLoader {
    constructor({ keys = null, paramPrefix = null, env: { region } = {}, ssm }) {
        if (!region) {
            throw new Error('[ParameterStoreStaticLoader] invalid region');
        }

        this.ssm = ssm || new AWS.SSM({ region });

        this.keys = keys;
        this.paramPrefix = paramPrefix;
    }

    load(params) {
        // loadImpl allows us to ensure the code is wrapped in a promise
        return loadImpl(this, params);
    }
}
ParameterStoreStaticLoader.MaxResults = 10;

const loadImpl = Promise.method((self, params) => {
    const { keys } = self;

    if (!keys) {
        throw new Error('[ParameterStoreStaticLoader] keys array missing');
    }

    const prefix = self.paramPrefix;
    const list = self.keys;
    const { MaxResults } = ParameterStoreStaticLoader;

    // we're still limited to 10 results at a
    const getPage = async() => {
        const req = { Names: keys, WithDecryption: true };

        const response = await self.ssm.getParameters(req);
        return mapResponse(params, response, prefix);
    };

    // parameters might be hierarchical in AWS. We add a prefix to the keys so they can be provided without environment specific
    //  prefixes (eg, prefix /dev/ key name key1 = /dev/key1)

    const groups = [];
    for (let i = 0; i < list.length; ++i) {
        const div = Math.floor(i / MaxResults);
        const mod = i % MaxResults;
        if (!(mod)) {
            groups[div] = [];
        }

        groups[div][mod] = `${prefix || ''}${list[i]}`;
    }

    return Promise.map(groups, (group) => getPage(group, params));
});

const mapResponse = (params, response, prefix) => {
    for (let p of response.Parameters) {
        const name = p.Name.substring(prefix ? prefix.length : 0);
        params[name] = p.Type === 'StringList' ? p.Value.split(',') : p.Value;
    }
};

module.exports = ParameterStoreStaticLoader;
