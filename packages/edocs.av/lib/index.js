'use strict';

// include the Supervisor, which creates and manages the worker pool. It's the workers that will ultimately poll from the Step Activity.
//  It's worth noting, that because this is node, there's only a single thread. Multiple workers is beneficial for allowing more visibility
//  of the activity, but it won't improve performance. So I recommend a relatively low number of workers. If you want more speed, you'd
//  want to invoke this script multiple times (and potentially modify the worker ids)
const { Supervisor } = require('@sage/sfab-workers-clam-av');

// these options allow you to modify how clam scan is used. You can look at the clam-scan package on npm if you want more detail
//  but these are generally good.
const clamScanOptions = {
    scan_log: '/var/log/node-clam', // potentially change the path depending on where you want your logs to go
    debug_mode: false, // ignore this, it's noisy
    scan_recursively: false, // choosing false here will save some CPU cycles
    clamdscan: {
        socket: '/tmp/clamd.sock', // This is the socket file used in your clamav installation script
        timeout: 300000, // 5 minutes: this is how long the module will wait for clamavdaemon before giving up
        multiscan: false, // this allows the daemon to scan multiple files at once if set to true. I just haven't tested it
    },
    preference: 'clamdscan' // If clamdscan is the daemon version, whereas clamscan would be the standalone. We want the d! ;)
};

// Make sure you specify the region your Step function exists on; and the ARN of your Step activity.
const supervisor = Supervisor.Create({ clamScanOptions, region: 'eu-west-1', activityArn: 'sample...arn:aws:states:eu-west-1:...my_activity', numberOfWorkers: 2 });
// initialising the supervisor allows it to create some services and various other re-usable stuff
supervisor.init()
    .then(() => {
        // and starting it sets off all the workers polling
        // each worker uses something called "long-polling" with AWS. Which means they make a http request, and AWS keeps that request
        // open as long as it can before returning. Overall, it improves performance and reduces the number of http requests made when
        // load is low. You don't NEED to know this, I just added it in case anyone thought of the question.
        supervisor.start();
        console.log('ALL WORKERS STARTED');
    });
