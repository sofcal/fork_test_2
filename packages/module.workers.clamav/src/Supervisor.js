'use strict';

const Worker = require('./Worker');

const ClamScan = require('@sage/bc-forks-clamscan');
const AWS = require('aws-sdk');
const Promise = require('bluebird');
const uuid = require('uuid/v4');
const _ = require('underscore');

const S3 = require('@sage/bc-services-s3');

const logPrefixDefault = '[clamAvScanner]';
const loggerDefault = {
    // debug is disabled by default
    debug: (/* obj */) => { /* console.debug(`${logPrefixDefault}${JSON.stringify(obj)}`); */ }, // eslint-disable-line no-console
    info: (obj) => { console.log(`${logPrefixDefault}${JSON.stringify(obj)}`); },  // eslint-disable-line no-console
    warn: (obj) => { console.warn(`${logPrefixDefault}${JSON.stringify(obj)}`); },  // eslint-disable-line no-console
    error: (obj) => { console.error(`${logPrefixDefault}${JSON.stringify(obj)}`); }  // eslint-disable-line no-console
};

const clamScanDefaults = {
    scan_log: '/var/log/node-clam', // You're a detail-oriented security professional.
    debug_mode: false, // This will put some debug info in your js console
    scan_recursively: false, // Choosing false here will save some CPU cycles
    clamdscan: {
        socket: '/tmp/clamd.sock', // This is pretty typical
        timeout: 300000, // 5 minutes
        multiscan: false, // You hate speed and multi-threaded awesome-sauce
    },
    preference: 'clamdscan' // If clamscan is found and active, it will be used by default
};

class Supervisor {
    constructor(config, { logger = loggerDefault } = {}) {
        const { step, region, bucket, activityArn, numberOfWorkers = 1, clamScanOptions = clamScanDefaults } = config;

        this.logger = logger;

        this.services = {
            step: step || new AWS.StepFunctions({ region }),
            s3: S3.Create({ bucket })
        };

        this.activityArn = activityArn;
        this.numberOfWorkers = numberOfWorkers;
        this.clamScanOptions = clamScanOptions;
        this.clam = null;
    }

    static Create(...args) {
        return new Supervisor(...args);
    }

    init() {
        const func = `${Supervisor.name}.init`;
        return Promise.resolve(undefined)
            .then(() => {
                this.logger.info({ function: func, msg: 'started' });

                if (this.clam) {
                    this.logger.info({ function: func, msg: 'clam already initialised' });
                    return undefined;
                }

                this.logger.info({ function: func, msg: 'initialising clam', params: { socket: this.clamScanOptions.clamdscan.socket } });
                return new ClamScan().init(this.clamScanOptions)
                    .then((clam) => {
                        this.clam = clam;

                        this.logger.info({ function: func, msg: 'initialising workers', params: { count: this.numberOfWorkers, activityArn: this.activityArn } });
                        this.workers = _.times(this.numberOfWorkers, (id) => {
                            const options = {
                                step: this.services.step,
                                s3: this.services.s3,
                                clam: this.clam,
                                activityArn: this.activityArn,
                                name: `clam_av_worker_${id}_${uuid()}`
                            };
                            return Worker.Create(options, { logger: this.logger });
                        });
                        this.logger.info({ function: func, msg: 'ended' });
                    });
            });
    }

    start({ only = null, except = null } = {}) {
        const func = `${Supervisor.name}.start`;
        this.logger.info({ function: func, msg: 'started' });

        _.each(this.workers, (worker) => {
            const validOnly = !only || _.contains(only, worker.name);
            const validExcept = !except || !_.contains(except, worker.name);

            if (validOnly && validExcept) {
                this.logger.info({ function: func, msg: 'starting worker', params: { name: worker.name } });
                worker.start();
            } else {
                this.logger.info({ function: func, msg: 'skipping worker', params: { name: worker.name } });
            }
        });

        this.logger.info({ function: func, msg: 'ended' });
    }

    stop({ only = [], except = [] } = {}) {
        const func = `${Supervisor.name}.stop`;
        this.logger.info({ function: func, msg: 'started' });

        _.each(this.workers, (worker) => {
            const validOnly = !only || _.contains(only, worker.name);
            const validExcept = !except || !_.contains(except, worker.name);
            if (validOnly && validExcept) {
                console.log('____STOPPING', worker.name);
                worker.stop();
            } else {
                console.log('____SKIPPING STOP FOR ', worker.name);
            }
        });
        this.logger.info({ function: func, msg: 'ended' });
    }
}

module.exports = Supervisor;
