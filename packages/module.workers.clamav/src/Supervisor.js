'use strict';

const Worker = require('./Worker');

const ClamScan = require('@sage/bc-forks-clamscan');
const AWS = require('aws-sdk');
const Promise = require('bluebird');
const uuid = require('uuid/v4');
const _ = require('underscore');

const S3 = require('@sage/bc-services-s3');
const Parameter = require('@sage/bc-services-parameter');

const clamScanOptions = {
    scan_log: '/var/log/node-clam', // You're a detail-oriented security professional.
    debug_mode: true, // This will put some debug info in your js console
    scan_recursively: false, // Choosing false here will save some CPU cycles
    clamdscan: {
        socket: '/tmp/clamd.sock', // This is pretty typical
        timeout: 300000, // 5 minutes
        multiscan: false, // You hate speed and multi-threaded awesome-sauce
    },
    preference: 'clamdscan' // If clamscan is found and active, it will be used by default
};

class Supervisor {
    constructor(config) {
        const { step, region, bucket, numberOfWorkers = 1 } = config;
        const paramPrefix = config.paramPrefix || `/${config.environment}/`;

        this.services = {
            step: step || new AWS.StepFunctions({ region }),
            parameter: Parameter.Create({ env: { region }, paramPrefix }),
            s3: S3.Create({ bucket })
        };
        this.numberOfWorkers = numberOfWorkers;
        this.clam = null;
    }

    init() {
        return Promise.resolve(undefined)
            .then(() => {
                if (this.clam) {
                    return undefined;
                }

                console.log('CREATING CLAM');
                return new ClamScan().init(clamScanOptions)
                    .then((clam) => {
                        console.log('CREATED CLAMSCAN');
                        this.clam = clam;

                        console.log('____CREATING WORKERS', this.numberOfWorkers);
                        this.workers = _.times(this.numberOfWorkers, (id) => Worker.Create({ step: this.services.step, s3: this.services.s3, clam: this.clam, name: `clam_av_worker_${id}_${uuid()}` }));
                        console.log('____CREATED WORKERS', this.workers.length);
                    });
            });
    }

    static Create(...args) {
        return new Supervisor(...args);
    }

    start({ only = null, except = null } = {}) {
        console.log('____STARTING ALL');
        _.each(this.workers, (worker) => {
            const validOnly = !only || _.contains(only, worker.name);
            const validExcept = !except || !_.contains(except, worker.name);
            if (validOnly && validExcept) {
                console.log('____STARTING', worker.name);
                worker.start();
            } else {
                console.log('____SKIPPING START FOR ', worker.name);
            }
        });
    }

    stop({ only = [], except = [] } = {}) {
        console.log('____STOPPING ALL');
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
    }
}

module.exports = Supervisor;
