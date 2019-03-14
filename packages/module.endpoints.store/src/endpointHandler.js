/* eslint-disable no-console */

'use strict';

const needle = require('needle');

// Cache of data for an endpoint
class EndpointHandler {
    constructor({
        endPoint,
        cacheExpiry,
        logger,
        opts,
    }) {
        this.endPoint = endPoint;
        this.cacheExpiry = cacheExpiry;
        this.logger = logger;

        this.func = 'EndpointHandler.impl';

        this.data = {};

        // set default user agent
        needle.defaults({
            user_agent: opts.userAgent
        });
    }

    // check last refresh time hasn't passed expiry point
    cacheExpired() {
        return Math.floor(Date.now() / 1000) > (this.refreshTime + this.cacheExpiry);
    }

    // Empty existing cache, then call endpoint to get new data
    buildCache() {
        return Promise.resolve()
            // empty old cache
            .then(() => {
                this.data = {};
            })
            // call endpoint
            .then(() => this.fetchEndPoint())
            // extract key id
            .then((res) => {
                const { keys } = res.body;
                keys.forEach(({ kid, x5c }) => {
                    this.data[kid] = x5c;
                });
            })
            .then(() => {
                this.refreshTime = Math.floor(Date.now() / 1000);
            })
            .catch((err) => {
                this.logger.error({ function: this.func, log: `Error building cache: ${err}` });
                throw err;
            });
    }

    // get Data - return from cache if not expired, otherwise call buildCache to refresh
    getData() {
        return Promise.resolve()
            // check if cache needs to be refreshed
            .then(() => {
                if (this.cacheExpired()) {
                    this.logger.info({ function: this.func, log: `endpoint ${this.endPoint} cache expired, refreshing` });
                    return this.buildCache();
                }
                return undefined;
            })
            // return all keys/certlists
            .then(() => this.data);
    }

    // fetch endpoint
    fetchEndPoint() {
        this.logger.info({ function: this.func, log: `Fetching data from endpoint ${this.endPoint}` });
        return Promise.resolve()
            .then(() => needle('get', this.endPoint))
            .catch((err) => {
                console.log(`alert: ${err}`);
                throw new Error(`Fetch endpoint error: ${err.message}`);
            });
    }
}

module.exports = {
    EndpointHandler
};
