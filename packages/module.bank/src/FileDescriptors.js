'use strict';

const access = require('safe-access');
const _ = require('underscore');

class FileDescriptors {
    constructor(bank) {
        this.bank = bank;
    }

    prune(daysOld = 30) {
        const cutOffDate = new Date();
        cutOffDate.setHours(0, 0, 0, 0);
        cutOffDate.setDate(cutOffDate.getDate() - daysOld);

        const predicate = (fd) => fd.timestamp < cutOffDate && !access(fd, 'quarantine.isQuarantined');
        this.bank.recentFileHistory = _.reject(this.bank.recentFileHistory, predicate);
    }

    pruneByFileName(regex) {
        const rejected = [];
        const retained = [];

        if (!regex || !(regex instanceof RegExp)) {
            return rejected;
        }

        _.each(this.bank.recentFileHistory, (fd) => {
            const target = regex.test(fd.fileName) ? rejected : retained;
            target.push(fd);
        });

        this.bank.recentFileHistory = retained;

        return rejected;
    }

    getInQuarantine() {
        return _.filter(this.bank.recentFileHistory, (fd) => access(fd, 'quarantine.isQuarantined'));
    }

    getInPeriod(periodHours = 24) {
        const periodEnd = new Date();
        periodEnd.setHours(periodEnd.getHours() - periodHours);

        return _.filter(this.bank.recentFileHistory, (fd) => periodEnd < fd.timestamp);
    }

    getLatest() {
        return _.last(_.sortBy(this.bank.recentFileHistory, (fd) => fd.timestamp));
    }

    getEarliestQuarantined() {
        return _.chain(this.bank.recentFileHistory)
            .filter((fd) => access(fd, 'quarantine.isQuarantined'))
            .sortBy((fd) => fd.timestamp)
            .first()
            .value();
    }

    getByFileName(fileName) {
        return _.find(this.bank.recentFileHistory, (fd) => fd.fileName === fileName);
    }

    get(fileId) {
        return _.find(this.bank.recentFileHistory, (fd) => fd.fileId === fileId);
    }

    exists(fileId) {
        return !!this.get(fileId);
    }

    add(fileId, fileName) {
        if (this.exists(fileId)) {
            throw new Error('Bank: file descriptor already exists');
        }

        this.bank.recentFileHistory = this.bank.recentFileHistory || [];
        this.bank.recentFileHistory.push({ fileId, fileName });

        return { fileId, fileName };
    }

    update(fileId, updated) {
        const fd = this.get(fileId);

        if (!fd) {
            throw new Error('Bank: file descriptor does not exist');
        }

        fd.timestamp = updated.timestamp;
        fd.quarantine = updated.quarantine;

        return fd;
    }
}

module.exports = FileDescriptors;
