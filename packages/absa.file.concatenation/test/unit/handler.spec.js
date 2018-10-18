const handler = require('../../lib/handler');
const impl = require('../../lib/impl');
const keys = require('../../lib/params');
const ErrorSpecs = require('../../lib/ErrorSpecs');
const should = require('should');
const sinon = require('sinon');
const Promise = require('bluebird');

const { ParameterStoreStaticLoader } = require('internal-parameterstore-static-loader');
const DB = require('internal-services-db');
const { StatusCodeError, StatusCodeErrorItem } = require('internal-status-code-error');

describe('absa-file-concatenation.handler', function() {
    let sandbox;
    let config, context, event;

    const username = 'user';
    const password = 'pass';
    const replicaSet = 'replica';
    const domain = 'domain';

    const env = 'local';
    const region = 'eu-west-1';

    const errFunc = () => { throw new Error('should be stubbed') };
    const dummyLoader = { load: errFunc };
    const db = { connect: errFunc, disconnect: errFunc };

    before(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {
        context = { context: 'context' };
        event = { AWS_REGION: region, env };

        config = {
            'defaultMongo.username': username,
            'defaultMongo.password': password,
            'defaultMongo.replicaSet': replicaSet,
            domain
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should retrieve params from param-store', (done) => {
        sandbox.stub(dummyLoader, 'load').resolves(config);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
        sandbox.stub(DB, 'Create').returns(db);
        sandbox.stub(db, 'connect').resolves();
        sandbox.stub(db, 'disconnect').resolves();

        const expected = { value: 'result' };
        sandbox.stub(impl, 'run').resolves(expected);

        handler.run(event, context, () => {
            try {
                const paramPrefix = '/local/';
                const region = 'eu-west-1';

                should(ParameterStoreStaticLoader.Create.callCount).eql(1);
                should(ParameterStoreStaticLoader.Create.calledWithExactly(
                    { keys, paramPrefix, env: { region } }
                )).eql(true);


                should(dummyLoader.load.callCount).eql(1);
                should(dummyLoader.load.calledWith(
                    {}
                )).eql(true);

                done();
            } catch(err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    it('should default env and region to test values', (done) => {
        sandbox.stub(dummyLoader, 'load').resolves(config);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
        sandbox.stub(DB, 'Create').returns(db);
        sandbox.stub(db, 'connect').resolves();
        sandbox.stub(db, 'disconnect').resolves();

        const expected = { value: 'result' };
        sandbox.stub(impl, 'run').resolves(expected);

        handler.run({}, context, () => {
            try {
                const paramPrefix = '/test/';
                const region = 'local';

                should(ParameterStoreStaticLoader.Create.callCount).eql(1);
                should(ParameterStoreStaticLoader.Create.calledWithExactly(
                    { keys, paramPrefix, env: { region } }
                )).eql(true);


                should(dummyLoader.load.callCount).eql(1);
                should(dummyLoader.load.calledWith(
                    {}
                )).eql(true);

                done();
            } catch(err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    it('should connect and disconnect from the db', (done) => {
        sandbox.stub(dummyLoader, 'load').resolves(config);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
        sandbox.stub(DB, 'Create').returns(db);
        sandbox.stub(db, 'connect').resolves();
        sandbox.stub(db, 'disconnect').resolves();

        const expected = { value: 'result' };
        sandbox.stub(impl, 'run').resolves(expected);

        // we test this by calling the it as a promise, so we can ensure disconnect is called
        handler.run(event, context, () => { })
            .then(() => {
                should(DB.Create.callCount).eql(1);
                should(DB.Create.calledWithExactly(
                    { env, region, domain, username, password, replicaSet }
                )).eql(true);

                should(db.connect.callCount).eql(1);
                should(db.connect.calledWith(
                    'bank_db'
                )).eql(true);

                should(db.disconnect.callCount).eql(1);
                should(db.disconnect.calledWith(
                )).eql(true);

                done();
            })
            .catch((err) => done(err instanceof Error ? err : new Error(err)))
    });

    it('should not attempt to disconnect from the db if the db was never created', (done) => {
        sandbox.stub(dummyLoader, 'load').rejects(new Error('params_error'));
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
        sandbox.stub(DB, 'Create').returns(db);
        sandbox.stub(db, 'connect').resolves();
        sandbox.stub(db, 'disconnect').resolves();

        const expected = { value: 'result' };
        sandbox.stub(impl, 'run').resolves(expected);

        // we test this by calling the it as a promise, so we can ensure disconnect is called
        handler.run(event, context, () => { })
            .then(() => {
                should(DB.Create.callCount).eql(0);
                should(db.connect.callCount).eql(0);
                should(db.disconnect.callCount).eql(0);

                done();
            })
            .catch((err) => done(err instanceof Error ? err : new Error(err)))
    });

    it('should call impl.run', (done) => {
        sandbox.stub(dummyLoader, 'load').resolves(config);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
        sandbox.stub(DB, 'Create').returns(db);
        sandbox.stub(db, 'connect').resolves();
        sandbox.stub(db, 'disconnect').resolves();

        const expected = { value: 'result' };
        sandbox.stub(impl, 'run').resolves(expected);

        handler.run(event, context, () => {
            try {
                should(impl.run.callCount).eql(1);
                should(impl.run.calledWithExactly(
                    event, config, { db }
                )).eql(true);

                done();
            } catch(err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    it('should call the callback with the success response', (done) => {
        sandbox.stub(dummyLoader, 'load').resolves(config);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
        sandbox.stub(DB, 'Create').returns(db);
        sandbox.stub(db, 'connect').resolves();
        sandbox.stub(db, 'disconnect').resolves();

        const expected = { value: 'result' };
        sandbox.stub(impl, 'run').resolves(expected);

        handler.run(event, context, (first, second) => {
            try {
                should(first).eql(null);

                should(second).eql({
                    statusCode: 200,
                    body: JSON.stringify({ value: 'result' })
                });

                done();
            } catch(err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    it('should call the callback with diagnoses', (done) => {
        sandbox.stub(dummyLoader, 'load').resolves(config);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
        sandbox.stub(DB, 'Create').returns(db);
        sandbox.stub(db, 'connect').resolves();
        sandbox.stub(db, 'disconnect').resolves();

        const expected = StatusCodeError.Create([StatusCodeErrorItem.Create('Code', 'Message')], 400);
        sandbox.stub(impl, 'run').rejects(expected);

        handler.run(event, context, (first, second) => {
            try {
                should(first).eql(null);

                should(second).eql({
                    statusCode: 400,
                    body: JSON.stringify(expected.toDiagnoses())
                });

                done();
            } catch(err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    it('should call the callback with a default 500 if impl throws an unexpected error', (done) => {
        sandbox.stub(dummyLoader, 'load').resolves(config);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
        sandbox.stub(DB, 'Create').returns(db);
        sandbox.stub(db, 'connect').resolves();
        sandbox.stub(db, 'disconnect').resolves();

        const err = new Error('impl.run.error');
        sandbox.stub(impl, 'run').rejects(err);

        handler.run(event, context, (first, second) => {
            try {
                should(first).eql(null);

                const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.internalServer], ErrorSpecs.internalServer.statusCode);
                should(second).eql({
                    statusCode: 500,
                    body: JSON.stringify(expected.toDiagnoses())
                });

                done();
            } catch(err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });


    it('should fail if any param store values are missing', function(done) {
        delete config['defaultMongo.password'];

        handler.run(event, context, (first, second) => {
            try {
                should(first).eql(null);

                const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.failedToRetrieveParameters], ErrorSpecs.failedToRetrieveParameters.statusCode);
                should(second).eql({
                    statusCode: 500,
                    body: JSON.stringify(expected.toDiagnoses())
                });

                done();
            } catch(err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });
});
