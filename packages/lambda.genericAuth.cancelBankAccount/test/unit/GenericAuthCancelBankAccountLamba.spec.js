const AWS = require('aws-sdk');
const uuidGen = require('uuid');
const Promise = require('bluebird');
const should = require('should');
const sinon = require('sinon');

const GenericAuthCancelBankAccountLambda = require('../../lib/GenericAuthCancelBankAccountLambda');
const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const { logger: loggerGen } = require('@sage/bc-debug-utils');

const DB = require('@sage/bc-services-db');
const { DBQueries } = require('../../lib/db');


describe('lambda-genericauth-cancelbankaccount', function(){
    let sandbox;
    const logger = loggerGen(true);
    const config = {config: 'value', region: 'region'};

    const errFunc = () => { throw new Error('should be stubbed') };
    const dummyLoader = { load: errFunc };
    const db = { connect: errFunc, disconnect: errFunc, getConnection: errFunc };

    const event = {
        logger: logger,
        body: {
            bankAccountId: '7531af69-fcc3-4d7c-937d-8c67aa20b9ef',
            providerId: '7531af69-fcc3-4d7c-937d-8c67aa20b9ef'
        }
    };

    const params = {
        test: 'test',
        env: 'testEnv',
        region: 'testRegion',
        domain: 'testDomain'
    };

    before(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {
        sandbox.stub(dummyLoader, 'load').resolves(params);
        sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(dummyLoader);
        sandbox.stub(DB, 'Create').returns(db);
        sandbox.stub(db, 'connect').resolves();
        sandbox.stub(db, 'disconnect').resolves();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should create post bank account lambda correctly', () => {
        const cancelBankAccLambda = GenericAuthCancelBankAccountLambda.Create({});
        should(cancelBankAccLambda.dbName).equal('bank_db');
    });

    it('should validate event and config', () => {
        const cancelBankAccLambda = GenericAuthCancelBankAccountLambda.Create(config);
        should(cancelBankAccLambda.validate(event, {logger})).equal(config.config);
    });

    it('should fail validation with no event', () => {
        try{
            const cancelBankAccLambda = GenericAuthCancelBankAccountLambda.Create({config});
            cancelBankAccLambda.validate(null, {logger});
        } catch (err){
            should(err.message).equal('Invalid Event');
        }
    });

    it('should fail validation with no config', () => {
        try{
            const cancelBankAccLambda = GenericAuthCancelBankAccountLambda.Create({});
            cancelBankAccLambda.validate(event, {logger});
        } catch (err){
            should(err.message).equal('Invalid Config');
        }
    });

    it('should exercise database connection', () => {
        const cancelBankAccLambda = GenericAuthCancelBankAccountLambda.Create(config);

        return cancelBankAccLambda.init(event,{logger})
            .then((actual) => {
                should(actual).eql(false);
            })
    });

    it('should process lambda successfully', () => {
        sandbox.stub(GenericAuthCancelBankAccountLambda.prototype,'invokeWebhook').returns(Promise.resolve());
        sandbox.stub(db, 'getConnection').resolves();
        sandbox.createStubInstance(DBQueries);
        sandbox.stub(DBQueries.prototype, 'updateBankAccount').returns(Promise.resolve());

        const cancelBankAccLambda = GenericAuthCancelBankAccountLambda.Create(config);
        const expectedRes = { statusCode: 200, body: 'Success'};

        return cancelBankAccLambda.init(event,{logger})
            .then (() => {
                return cancelBankAccLambda.impl(event,{logger})
                    .then((actual) => {
                        should(actual).eql(expectedRes);
                    })
            })
    });

    describe('InvokeWebHookAuthNotification', () => {
        it('Should invoke outbound webhook lambda', () => {
            const cancelBankAccLambda = GenericAuthCancelBankAccountLambda.Create(config);
            const mockResponse = { StatusCode:  200 };

            const invokeStub = sandbox.stub().returns({ promise: () => Promise.resolve(mockResponse) });
            sandbox.stub(AWS, 'Lambda').returns({
                invoke: invokeStub
            });

            const providerId = uuidGen.v4();
            const bankAccountId = uuidGen.v4();
            const externalId = uuidGen.v4();

            const expectedPayload = {
                body: {
                    providerId,
                    resourceId: bankAccountId,
                    eventType: 'resourceDeleted',
                    resourceType: 'bankAccount',
                    resourceUrl: 'NA'
                }
            };

            return cancelBankAccLambda.invokeWebhook({logger, providerId, bankAccountId, externalId, env: 'dev03', region: 'eu-west-1'} )
                .then(() => {
                    should(invokeStub.callCount).eql(1);
                    const lambdaPayload = JSON.parse(invokeStub.getCall(0).args[0].Payload);
                    should(lambdaPayload).eql(expectedPayload);
                });
        });

        it('Should throw should a non 200 status code be returned', () => {
            const cancelBankAccLambda = GenericAuthCancelBankAccountLambda.Create(config);
            const mockResponse = { StatusCode:  500 };

            const invokeStub = sandbox.stub().returns({ promise: () => Promise.resolve(mockResponse) });
            sandbox.stub(AWS, 'Lambda').returns({
                invoke: invokeStub
            });

            const providerId = uuidGen.v4();
            const bankAccountId = uuidGen.v4();
            const externalId = uuidGen.v4();

            const expectedPayload = {
                body: {
                    providerId,
                    resourceId: bankAccountId,
                    eventType: 'resourceCreated',
                    resourceType: 'bankAccount',
                    resourceUrl: 'NA',
                    additionalData: { externalId }
                }
            };

            return cancelBankAccLambda.invokeWebhook({logger, providerId, bankAccountId, externalId, env: 'dev03', region: 'eu-west-1'} )
                .then(() => {
                    should(invokeStub.callCount).eql(1);
                    const lambdaPayload = JSON.parse(invokeStub.getCall(0).args[0].Payload);
                    should(lambdaPayload).eql(expectedPayload);
                })
                .then(() => {
                    throw new Error('should have thrown');
                })
                .catch((err) => {
                    should(err.message).eql('failed to invoke Lambda status code 500');
                })
        })
    });
});
