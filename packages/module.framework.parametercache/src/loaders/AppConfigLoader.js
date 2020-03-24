'use strict';

const AWS = require('aws-sdk');
const uuidGen = require('uuid');

AWS.config.setPromisesDependency(require('bluebird'));

const jsonMime = 'application/json';

class AppConfigLoader {
    constructor({ appConfigApplication, paramPrefix, env: { region } = {}, appConfig }) {
        if (!region) {
            throw new Error('[AppConfigLoader] invalid region');
        }

        if (!paramPrefix) {
            throw new Error('[AppConfigLoader] invalid paramPrefix');
        }

        this.clientId = uuidGen.v4();

        this.appConfig = appConfig || new AWS.AppConfig({ apiVersion: '2019-10-09' });

        this.application = appConfigApplication;
        this.environment = paramPrefix.split('/')[1];
        this.region = region;

        this.configuration = {};
    }

    load(params) {
        return loadImpl(this, params);
    }
}

const loadImpl = async(self, params) => {
    const {
        application,
        environment,
        region,
        clientId
    } = self;

    // figure out which configuration file we need (based on application, environment and region)
    const req = {
        Application: application,
        ClientId: clientId,
        Configuration: `${application}-${environment}-${region}`,
        Environment: `${environment}-${region}`
    };

    let Content, ContentType;

    try {
        ({ Content, ContentType } = await self.appConfig.getConfiguration(req).promise());

        if (ContentType !== jsonMime) {
            console.error(`[AppConfigLoader] Invalid content type returned by AWS AppConfig (expected ${jsonMime}, received ${ContentType}, returning last known good configuration.`);
        } else {
            self.configuration = Content;
        }
    } catch {
        console.error(`[AppConfigLoader] Failed to retrieve configuration file from AppConfig, returning last known good configuration.`);
    }

    return mapResponse(params, self.configuration);
};

// We always expect a flat file, similar to the response from SSM Parameter Store, but we
// don't have to worry about prefixes since each environment has its own configuration file.
const mapResponse = (params, response) => {
    for (let [name, value] of Object.entries(response)) {
        params[name] = value;
    }
};

module.exports = AppConfigLoader;
