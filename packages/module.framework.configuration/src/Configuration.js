'use strict';

const Promise = require('bluebird');
const hash = require('object-hash');

const {
    ParameterCache: { instance: ParameterCacheInstance },
    ParameterLoaders: { ParameterStoreStaticLoader, ParameterStoreDynamicLoader, EnvironmentLoader, AppConfigLoader },
    mocks: ParameterCacheMocks
} = require('@sage/bc-framework-parametercache');

const {
    ConfigLoader, SecretConfigLoader, ConfigMergeLoader,
    mocks: ParameterCacheConfigMocks,
    util: { merge }
} = require('@sage/bc-framework-parametercache-configloaders');

let config = null;
let actualHash = null;

const secretsPropertyName = '__secrets';
const configPropertyName = '__config';
const overridesPropertyName = '__overrides';

class Configuration {
    static get() {
        return config || undefined; // ensure undefined is return to mimic old behaviour
    }

    static merge(...args) {
        return merge(...args);
    }

    static calculateHash(obj) {
        // We don't want to modify the configuration
        obj = Configuration.snapshot(obj);

        if(obj.meta && obj.meta.plain)
            delete obj.meta.plain.hash;

        if(obj.meta && obj.meta.encrypted)
            delete obj.meta.encrypted.hash;

        return hash(obj);
    }

    static snapshot(obj) {
        if(obj == null || typeof(obj) !== 'object') {
            return obj;
        }

        const temp = new obj.constructor();

        for(const key in obj) {
            if (obj.hasOwnProperty(key)) {
                temp[key] = Configuration.snapshot(obj[key]);
            }
        }

        return temp;
    }

    static getActualHash() {
        return actualHash;
    }

    static load(...args){
        return loadImpl(...args);
    }
}

const loadImpl = Promise.method((defaultsCallback) => {
    if (config){
        return config;
    }

    /* eslint-disable no-multi-spaces */
    const configPath            = process.env.CONFIGPATH;                       // path to config file
    const configSecretPath      = process.env.CONFIGSECRETPATH;                 // path to encrypted config file
    const envConfig             = process.env.CONFIG;                           // full config as environment variable
    const useParamStoreStatic   = process.env.PARAM_STORE_STATIC === 'true';    // should we use the static param-store loader
    const useParamStoreDynamic  = process.env.PARAM_STORE_DYNAMIC === 'true';   // should we use the dynamic param-store loader
    const paramPrefix           = process.env.PARAM_STORE_PREFIX;               // prefix for use in param-store loaders
    const localParamPath        = process.env.LOCAL_PARAMS_PATH;                // json file representing param-store values for use in mock
    const useAWSMocks           = process.env.USE_AWS_MOCKS;                    // should we use the mock implementations of AWS features
    const configUseAppConfig    = process.env.USE_APP_CONFIG === 'true';        // should we use AWS AppConfig to retrieve additional settings?

    const region                = process.env.AWS_REGION;                       // aws region we're working on (not needed if only using CONFIGPATH)
    /* eslint-enable no-multi-spaces */

    if (!region) {
        console.log('WARNING: DEFAULTING AWS REGION TO US-EAST-1');
    }

    const ssm = useAWSMocks ? new ParameterCacheMocks.SSM({ region, path: localParamPath }) : null;
    const kms = useAWSMocks ? new ParameterCacheConfigMocks.KMS({ region }) : null;

    // we always load environment variables. These are often used in some of the loaders. But mostly it just provides
    //  consistency in accessing variables.
    const loaders = [new EnvironmentLoader({ env: process.env })];

    // order of priority = param-store-static > param-store-dynamic > secret-config
    if (useParamStoreStatic) {
        loaders.push(new ParameterStoreStaticLoader({ env: { region }, secretsPropertyName, ssm }));
    } else if (useParamStoreDynamic) {
        loaders.push(new ParameterStoreDynamicLoader({ env: { region }, paramPrefix, ssm }));
    } else if (configSecretPath) {
        loaders.push(new SecretConfigLoader({ path: configSecretPath }, kms));
    }

    if (configUseAppConfig) {
        loaders.push(new AppConfigLoader({ env: { region } }));
    }

    // the framework loader expects a base config file. So we always add that loader. It comes after the param-store loaders
    //  because it injects their values into the config generator
    loaders.push(new ConfigLoader({ path: configPath, secretsPropertyName }));
    loaders.push(new ConfigMergeLoader({ overridesPropertyName }));

    // no refresh on the cache, as we can't support that yet.
    ParameterCacheInstance.init({ cacheTTL: -1 }, loaders);

    return ParameterCacheInstance.load()
        .then(function(params) {
            config = defaultsCallback ? defaultsCallback(params[configPropertyName]) : params[configPropertyName];

            return config;
        });
});

module.exports = Configuration;
