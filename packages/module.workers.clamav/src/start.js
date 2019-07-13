'use strict';

const Supervisor = require('./Supervisor');

const supervisor = Supervisor.Create({ region: 'eu-west-1', numberOfWorkers: 2 });
supervisor.init()
    .then(() => {
        supervisor.start();
    });

console.log('ALL WORKERS STARTED');
