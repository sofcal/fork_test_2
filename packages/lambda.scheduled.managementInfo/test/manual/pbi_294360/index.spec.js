const should = require('should');
const { run } = require('../../../lib/handler');
const sinon = require('sinon');
const AWS = require('aws-sdk');
const Promise = require('bluebird');
const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
//const { BlobStorage } = require('./blob');
const serviceLoader = require('../../../lib/serviceLoader');
const fs = require('fs');

describe('lambda-scheduled-managementinfo.index', function(){
    const callback = (err, pass) => err ? console.log('ERROR => ', err.message) : console.log('COMPLETED => ', pass);

    const event = {
        products: 'ALL',
        concat: 'ALL',
        orphans: true,
    };
    const context = { context: 'context' };
    
    const errFunc = () => { throw new Error('should be stubbed') };
    const dummyLoader = { load: errFunc };

    before(() => {
        sandbox = sinon.createSandbox();   
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
                    const filename = `./test/manual/pbi_294360/result/${key.replace(/\//g,'_')}`;
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
                    const filename = `./${key.replace(/\//g,'_')}`;
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
        sandbox.restore();
    });

    it('run should be a function', () => {
        return run.should.be.a.Function();
    });

    it('should skip everything if no requests', () => {
        return run({}, context, callback);
    })

    it('products all?', () => {
        return run(event, context, callback);
    })

});
