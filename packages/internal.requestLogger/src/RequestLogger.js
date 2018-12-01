'use strict';

const noop = () => {};

class RequestLogger {
    constructor(request = {}, logLevel = RequestLogger.LogLevels.INFO) {
        this.request = request;

        /* eslint-disable no-console */
        const debug = (data) => {
            const timestamp = new Date().toISOString();
            console.log(JSON.stringify(Object.assign({ '@timestamp': timestamp, severity: 'DEBUG' }, this.request, data)));
        };

        const info = (data) => {
            const timestamp = new Date().toISOString();
            console.log(JSON.stringify(Object.assign({ '@timestamp': timestamp, severity: 'INFO' }, this.request, data)));
        };

        const warn = (data) => {
            const timestamp = new Date().toISOString();
            console.warn(JSON.stringify(Object.assign({ '@timestamp': timestamp, severity: 'WARN' }, this.request, data)));
        };

        const error = (data) => {
            const timestamp = new Date().toISOString();
            console.error(JSON.stringify(Object.assign({ '@timestamp': timestamp, severity: 'ERROR' }, this.request, data)));
        };
        /* eslint-enable no-console */

        // assign direct to the instance so different loggers can have different log levels. The log level can NOT be modified
        // after construction; this allows improved performance by avoiding if checks during logging
        this.debug = logLevel >= RequestLogger.LogLevels.DEBUG ? debug : noop;
        this.info = logLevel >= RequestLogger.LogLevels.INFO ? info : noop;
        this.warn = logLevel >= RequestLogger.LogLevels.WARN ? warn : noop;
        this.error = logLevel >= RequestLogger.LogLevels.ERROR ? error : noop;
    }

    extend(extension) {
        this.request = Object.assign({}, this.request, extension);
    }

    stringifiableError(err) { // eslint-disable-line class-methods-use-this
        // Error objects are not stringifiable, as it's properties are not marked as enumerable. There are ways around this, but
        // for simple usage this will do the trick
        return err.constructor === Error ? { message: err.message } : err;
    }

    static Create(...args) {
        return new RequestLogger(...args);
    }
}

RequestLogger.LogLevels = { DEBUG: 4, INFO: 3, WARN: 2, ERROR: 1 };

module.exports = RequestLogger;
