const sinon = require('sinon');
const _ = require('underscore');
const CreateTransactions = require('../../lib/CreateTransactions');
const DB = require('../../../module.services.db/lib/index');

describe('runonce-intacct-transactiongenerator.CreateTransactions', function () {

    const env = 'local';
    const region = 'eu-west-1';
    const username = 'user';
    const password = 'pass';
    const replicaSet = 'replica';
    const domain = 'domain';
    const errFunc = () => {
        throw new Error('should be stubbed')
    };
    const dummyLoader = { load: errFunc };

    let sandbox;
    const doNothing = () => {

    };
    let logger = {
        info: doNothing,
        err: doNothing
    };
    let handler;
    let context;
    let callback;
    let config;
    let event;

    let db;
    let dbConnection;

    before(()=>{
        sandbox = sinon.sandbox.create();
    });

    after(()=> {
    });

    beforeEach(() => {
        config = { Environment: env, AWS_REGION: region };
        sandbox.stub(process, 'env').value(_.extend(process.env, { Environment: env, AWS_REGION: region }));
        callback = sinon.spy();
        context = { context: 'context' };
        event = { AWS_REGION: region, env };

    });

    afterEach(() => {
        sandbox.restore();
    });

    // it.only('should do something', (done) => {
    //
    //     const event = { logger, bankAccountId: '1', startTrxNo: 0, NumTrxToCreate: 2 };
    //     handler = new CreateTransactions({ config });
    //     return handler.run(event, context, callback)
    //        .then((x) => {
    //             console.log(x);
    //             done();
    //        })
    // });



});
