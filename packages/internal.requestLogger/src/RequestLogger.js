'use strict';

class RequestLogger {
    constructor(request = {}) {
        this.request = request;
    }

    extend(extension) {
        this.request = Object.assign({}, this.request, extension);
    }

    /* eslint-disable no-console */
    debug(data) {
        const timestamp = new Date().toISOString();
        console.log(JSON.stringify(Object.assign({ '@timestamp': timestamp, severity: 'DEBUG' }, this.request, data)));
    }

    info(data) {
        const timestamp = new Date().toISOString();
        console.log(JSON.stringify(Object.assign({ '@timestamp': timestamp, severity: 'INFO' }, this.request, data)));
    }

    warn(data) {
        const timestamp = new Date().toISOString();
        console.warn(JSON.stringify(Object.assign({ '@timestamp': timestamp, severity: 'WARN' }, this.request, data)));
    }

    error(data) {
        const timestamp = new Date().toISOString();
        console.error(JSON.stringify(Object.assign({ '@timestamp': timestamp, severity: 'ERROR' }, this.request, data)));
    }
    /* eslint-enable no-console */

    stringifiableError(err) { // eslint-disable-line class-methods-use-this
        // Error objects are not stringifiable, as it's properties are not marked as enumerable. There are ways around this, but
        // for simple usage this will do the trick
        return err.constructor === Error ? { message: err.message } : err;
    }

    static Create(...args) {
        return new RequestLogger(...args);
    }
}

module.exports = RequestLogger;
