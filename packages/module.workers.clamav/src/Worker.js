'use strict';

const { Readable } = require('stream');

const Promise = require('bluebird');

class Worker {
    constructor({ step, s3, clam, name }) {
        this.name = name;
        this.services = { step, s3, clam };
        this.active = false;
    }

    static Create(...args) {
        return new Worker(...args);
    }

    start() {
        this.active = true;

        poll(this);
    }

    stop() {
        this.active = false;
    }

    waitOnTask() {
        console.log('BEGINNING WAIT ON TASK');
        return Promise.resolve(undefined)
            .then(() => {
                const taskOptions = { activityArn: 'arn:aws:states:eu-west-1:277381856145:activity:test_activity_3', workerName: this.name };
                return this.services.step.getActivityTask(taskOptions).promise()
                    .then(({ taskToken, input }) => {
                        console.log('___LONG POLL FINISHED');
                        if (!taskToken) {
                            console.log('NO TASK');
                            return undefined;
                        }

                        return scan(this.services, taskToken, input)
                            .then((result) => {
                                console.log('______SENDING SUCCESS')
                                const successOptions = { taskToken, output: input };
                                return this.services.step.sendTaskSuccess(successOptions).promise()
                                    .then((res) => {
                                        console.log('______RES');
                                        console.log(res);
                                    });
                            })
                            .catch((err) => {
                                const failureOptions = { taskToken, cause: 'AV Check error', error: err.message };
                                console.log('______SENDING FAILURE')
                                console.log(err);
                                return this.services.step.sendTaskFailure(failureOptions).promise();
                            });
                    });
            })
            .catch((err) => {
                console.log('SOME ERROR');
                console.log(err);
            })
            .then(() => Promise.delay(1000));
    }
}

const poll = Promise.method((self) => {
    console.log('POLL START')
    return self.waitOnTask()
        .then(() => {
            if (self.active) {
                console.log('CALLING POLL')
                poll(self);
            }
        });
});

const scan = Promise.method((services, taskToken, input) => {
    console.log('_____PERFORMING SCAN');
    console.log(taskToken);
    console.log(input);

    const parsed = JSON.parse(input);
    return services.s3.get(`${parsed.prefix}${parsed.fileName}`, parsed.bucket)
        .then((data) => {
            console.log(data);
            if (!data.Body) {
                throw new Error('s3 file is empty');
            }

            const stream = bufferToStream(data.Body);
            //return services.clam.is_infected('/Users/wayne.smith/Desktop/BC-ArchitecturalOverview-040619-2304-312.pdf')
            return services.clam.scan_stream(stream)
                .then((isInfected) => {
                    console.log('_____RESULT', isInfected);
                });
        });
});

const bufferToStream = (data) => {
    const readable = new Readable();
    readable._read = () => {}; // _read should be used to populate the stream, but we're pushing direct to it as we have the data in memory
    readable.push(data);
    readable.push(null);
    const original = readable.destroy;
    readable.destroy = () => {
        console.log('____ORIG')
        console.log(original);
    };

    return readable;
};

module.exports = Worker;
