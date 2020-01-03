'use strict';

const resources = require('@sage/bc-common-resources');

function Lock(logger, data) {
    let self = this;

    if (data) {
        self.uuid = data.uuid;
        self.expiry = data.expiry;
    }

    self.logger = logger;  // not persisted, looking for a nicer way to get a logger to checkLocked()
}

Lock.validate = function (lock) {
};

let p = Lock.prototype;

p.checkLocked = function (entity) {

    if (this.uuid !== entity.uuid) {
        this.logger.error({function: 'Lock.CheckLock', msg: 'Invalid lock - wrong object.', params: {uuid: this.uuid}});
        throw new Error('Check lock failed.  Applies to: ' + this.uuid + ' not:' + entity.uuid);
    }

    const now = new Date();
    if (this.expiry < now) {
        this.logger.error({
            function: 'Lock.CheckLock',
            msg: 'Invalid lock',
            params: { uuid: this.uuid, expired: this.expiry, attempted: now },
            alert: resources.lock.alerts.lockExpired
        });
        throw new Error(`Lock on: ${this.uuid} has expired during processing.`);
    }
};

p.validate = function () {
    Lock.validate(this);
};

Lock.filter = function filterFn(data) {
    return data;
};

module.exports = Lock;
