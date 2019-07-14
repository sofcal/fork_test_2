'use strict';

const { Readable } = require('stream');

const Promise = require('bluebird');

const consts = {
    INFECTED: 'Infected',
    CLEAN: 'Clean'
};

class Worker {
    constructor({ step, s3, activityArn, clam, name }, { logger }) {
        this.logger = logger;

        this.activityArn = activityArn;
        this.name = name;
        this.services = { step, s3, clam };
        this.active = false;
    }

    static Create(...args) {
        return new Worker(...args);
    }

    start() {
        const func = `${Worker.name}.start`;
        this.logger.info({ function: func, msg: 'started', params: { worker_name: this.name } });
        this.active = true;

        poll(this);
        this.logger.info({ function: func, msg: 'ended', params: { worker_name: this.name } });
    }

    stop() {
        const func = `${Worker.name}.stop`;
        this.logger.info({ function: func, msg: 'started', params: { worker_name: this.name } });
        this.active = false;

        this.logger.info({ function: func, msg: 'ended', params: { worker_name: this.name } });
    }

    waitOnTask() {
        const func = `${Worker.name}.waitOnTask`;
        this.logger.debug({ function: func, msg: 'started', params: { worker_name: this.name } });
        return Promise.resolve(undefined)
            .then(() => {
                const taskOptions = { activityArn: this.activityArn, workerName: this.name };
                return this.services.step.getActivityTask(taskOptions).promise()
                    .then(({ taskToken, input = '{}' }) => {
                        if (!taskToken) {
                            this.logger.debug({ function: func, msg: 'no task after long poll. Retrying', params: { worker_name: this.name } });
                            return undefined;
                        }

                        this.logger.info({ function: func, msg: 'retrieved task', params: { worker_name: this.name, taskToken } });
                        const parsed = JSON.parse(input);

                        return scan(this.services, taskToken, parsed, { logger: this.logger })
                            .then((result) => {
                                parsed.scanStatus = result.is_infected ? consts.INFECTED : consts.CLEAN;
                                const successOptions = { taskToken, output: JSON.stringify(parsed) };

                                this.logger.info({ function: func, msg: 'sending success result', params: { worker_name: this.name, is_infected: result.is_infected, scanStatus: successOptions.scanStatus } });
                                return this.services.step.sendTaskSuccess(successOptions).promise();
                            })
                            .catch((err) => {
                                this.logger.error({ function: func, msg: 'error occurred during scan. Sending failure result', params: { worker_name: this.name, error: err.message } });
                                const failureOptions = { taskToken, cause: 'AV Check error', error: err.message };
                                return this.services.step.sendTaskFailure(failureOptions).promise();
                            });
                    });
            })
            .catch((err) => {
                this.logger.error({ function: func, msg: 'error attempting to retrieve task. Swallowing', params: { worker_name: this.name, error: err.message } });
            })
            .then(() => Promise.delay(1000))
            .then(() => {
                this.logger.debug({ function: func, msg: 'ended', params: { worker_name: this.name } });
            });
    }
}

const poll = Promise.method((self) => {
    return self.waitOnTask()
        .then(() => {
            if (self.active) {
                poll(self);
            }
        });
});

const scan = Promise.method((services, taskToken, parsed, { logger }) => {
    const func = `${Worker.name}.scan`;
    logger.info({ function: func, msg: 'started', params: { worker_name: this.name } });

    const bucket = parsed.bucket;
    const key = `${parsed.prefix}${parsed.fileName}`;

    logger.info({ function: func, msg: 'retrieving file from s3', params: { worker_name: this.name, bucket, key } });

    return services.s3.get(key, bucket)
        .catch((err) => {
            logger.info({ function: func, msg: 'error retrieving file from s3', params: { worker_name: this.name, error: err.message } });
            throw err;
        })
        .then((data) => {
            logger.info({ function: func, msg: 'retrieved file from s3', params: { worker_name: this.name } });
            if (!data.Body) {
                logger.info({ function: func, msg: 'file had no content', params: { worker_name: this.name } });
                throw new Error('s3 file is empty');
            }

            logger.info({ function: func, msg: 'beginning scan', params: { worker_name: this.name } });
            const stream = bufferToStream(data.Body);
            return services.clam.scan_stream(stream)
                .then((result) => {
                    logger.info({ function: func, msg: 'ended', params: { worker_name: this.name } });
                    return result;
                });
        });
});

const bufferToStream = (data) => {
    const readable = new Readable();
    readable._read = () => {}; // _read should be used to populate the stream, but we're pushing direct to it as we have the data in memory
    readable.push(data);
    readable.push(null);
    readable.destroy = () => {
        // pass-through to allow this stream to work with clamscan
    };

    return readable;
};

module.exports = Worker;
