'use strict';

const Supervisor = require('./Supervisor');

const supervisor = Supervisor.Create({ region: 'eu-west-1', activityArn: 'arn:aws:states:eu-west-1:277381856145:activity:test_activity_3', numberOfWorkers: 2 });
supervisor.init()
    .then(() => {
        supervisor.start();
        console.log('ALL WORKERS STARTED');
    });

