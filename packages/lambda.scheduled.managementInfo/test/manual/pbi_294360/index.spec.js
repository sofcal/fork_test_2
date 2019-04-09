const should = require('should');
const { run } = require('../../../lib/handler');
const sinon = require('sinon');
const AWS = require('aws-sdk');
const Promise = require('bluebird');
const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const serviceLoader = require('../../../lib/serviceLoader');
const fs = require('fs');

const outputFolder = './test/manual/pbi_294360/result/'

describe('lambda-scheduled-managementinfo.index', function(){
    process.env.AWS_REGION = process.env.AWS_REGION ? process.env.AWS_REGION : 'eu-west-1';
    process.env.Environment = process.env.Environment ? process.env.Environment : 'dev';
    process.env.localhost = process.env.localhost ? process.env.localhost : true;
    process.env.bucket = process.env.bucket ? process.env.localbuckethost : 'eu-west-1-logs';

    const event = {
        products: 'ALL',
        concat: 'ALL',
        orphans: true,
        logLevel: 4,
    };
    const context = { context: 'context' };
    
    const errFunc = () => { throw new Error('should be stubbed') };
    const dummyLoader = { load: errFunc };
    let callbackSpy;

    before(() => {
        sandbox = sinon.createSandbox();
        callbackSpy = sinon.spy();
    });

    beforeEach(() => {
        const CloudWatchLogsStub = sandbox.stub(AWS, 'CloudWatchLogs');
        CloudWatchLogsStub.returns(new Object({
            describeSubscriptionFilters: sandbox.stub()
                .returns({ promise: () => Promise.resolve({ subscriptionFilters: 'test' }) }),
            putSubscriptionFilter: sandbox.stub().callsFake(() => ({ promise: () => {} })),
        }));
        const serviceLoaderStub = sandbox.stub(serviceLoader, 'load');
        const upload = (key, readable, code, bucket) => {
            return Promise.resolve()
                .then(() => {
                    const filename = `${outputFolder}${key.replace(/\//g,'_')}`;
                    readable.setEncoding('utf8');
                    const data = readable.read();
                    console.log(`@serviceloader upload filename ${filename}`);

                    try {
                        fs.writeFileSync(filename, data);
                        console.log(`@serviceloader s3 saved file ${filename}`);
                    } catch (err) {
                        console.log(`@serviceloader s3 error saving file ${filename} - ${err}`);
                        throw err
                    }
                    return undefined
                });
        }
        const get = (key, bucket) => {
            return Promise.resolve()
                .then(() => {
                    const filename = `${outputFolder}${key.replace(/\//g,'_')}`;
                    console.log(`@serviceloader get filename ${filename}`);
                    let result

                    try {
                        const Body = fs.readFileSync(filename);
                        console.log(`@serviceloader s3 loaded file ${filename}`);
                        result = {
                                Body
                            }
                    } catch(err) {
                        console.log(`@serviceloader s3 error reading file ${filename} - ${err}`);
                        throw err
                    }
                    return result
                });
        }
        serviceLoaderStub.returns({
            s3: {
                upload,
                get
            }
        });
        const username = 'user';
        const password = 'pass';
        const replicaSet = 'replica';
        const domain = 'domain';
        paramconfig = {
            'defaultMongo.username': username,
            'defaultMongo.password': password,
            'defaultMongo.replicaSet': replicaSet,
            domain
        };
        sandbox.stub(dummyLoader, 'load').resolves(paramconfig);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
    });

    afterEach(() => {
        callbackSpy.resetHistory();
        sandbox.restore();
    });

    describe('Set up', () => {
        it('run should be a function', () => {
            return run.should.be.a.Function();
        });
    });

    describe('Failing run', () => {
        const processEnvironment = process.env.Environment;

        before(() => {
            delete process.env.Environment;
        });
        after(() => {
            process.env.Environment = processEnvironment;
        });

        it('should fail if Environment setting not set', () => {
            return run({}, context, callbackSpy)
                .then(() => should.equal(callbackSpy.args[0][0], null) )
                .then(() => should.equal(callbackSpy.args[0][1].statusCode, 400) )
        })
    });

    describe('No request run', () => {
        it('should skip everything if no requests', () => {
            return run({}, context, callbackSpy)
                .then(() => should.equal(callbackSpy.args[0][0], null) )
                .then(() => should.equal(callbackSpy.args[0][1].statusCode, 200) )
        })
    })

    describe('Process data run', () => {
        it('Process all products', () => {
            return run(event, context, callbackSpy)
            .then(() => should.equal(callbackSpy.args[0][0], null) )
            .then(() => should.equal(callbackSpy.args[0][1].statusCode, 200) )
        })
    })

});
