const AWS = require('aws-sdk');
const uuidGen = require('uuid');
const Promise = require('bluebird');
const should = require('should');
const sinon = require('sinon');

const GenericAuthPostBankAccountLambda = require('../../lib/GenericAuthPostBankAccountLambda');
const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const { RequestLogger } = require('@sage/bc-requestlogger');
const { logger: loggerGen } = require('@sage/bc-debug-utils');
const KeyValuePairCache = require('@sage/bc-services-keyvaluepaircache');

const DB = require('@sage/bc-services-db');
const { DBQueries } = require('../../lib/db');


describe('lambda-genericauth-postbankaccount', function(){
    let sandbox;
    const logger = loggerGen(true);
    const config = {config: 'value', region: 'region'};

    const errFunc = () => { throw new Error('should be stubbed') };
    const dummyLoader = { load: errFunc };
    const db = { connect: errFunc, disconnect: errFunc, getConnection: errFunc };

    const event = {
        logger: logger,
        body: {
            "bankAccount": {
                "accountIdentifier": "7531af69-fcc3-4d7c-937d-8c67aa20b9ef",
                "accountKey": "12345"
            }
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
        sandbox.stub(KeyValuePairCache.prototype, 'connect').returns(Promise.resolve(true));
        sandbox.stub(DB, 'Create').returns(db);
        sandbox.stub(db, 'connect').resolves();
        sandbox.stub(db, 'disconnect').resolves();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should create post bank account lambda correctly', () => {
        const postBankLambda = GenericAuthPostBankAccountLambda.Create({});
        should(postBankLambda.dbName).equal('bank_db');
    });

    it('should validate event and config', () => {
        const postBankLambda = GenericAuthPostBankAccountLambda.Create(config);
        should(postBankLambda.validate(event, {logger})).equal(config.config);
    });

    it('should fail validation with no event', () => {
        try{
            const postBankLambda = GenericAuthPostBankAccountLambda.Create({config});
            postBankLambda.validate(null, {logger});
        } catch (err){
            should(err.message).equal('Invalid Event');
        }
    });

    it('should fail validation with no config', () => {
        try{
            const postBankLambda = GenericAuthPostBankAccountLambda.Create({});
            postBankLambda.validate(event, {logger});
        } catch (err){
            should(err.message).equal('Invalid Config');
        }
    });

    it('should exercise database connection', () => {
        const postBankLambda = GenericAuthPostBankAccountLambda.Create(config);

        return postBankLambda.init(event,{logger})
            .then((actual) => {
                should(actual).eql(false);
            })
    });

    it('should process lambda successfully', () => {
        const responseKey = {
            returnPayload : {
                accounts: [{
                    "accountIdentifier": "7531af69-fcc3-4d7c-937d-8c67aa20b9ef",
                    "accountKey": "12345"
                }]
            }
        };
        sandbox.stub(KeyValuePairCache.prototype, 'retrievePair').returns(Promise.resolve({key:'someKey', value: responseKey}));
        sandbox.stub(GenericAuthPostBankAccountLambda.prototype,'invokeWebhook').returns(Promise.resolve());
        sandbox.stub(db, 'getConnection').resolves();
        sandbox.createStubInstance(DBQueries);
        sandbox.stub(DBQueries.prototype, 'updateBankAccount').returns(Promise.resolve());

        const postBankLambda = GenericAuthPostBankAccountLambda.Create(config);
        const expectedRes = { statusCode: 200, body: 'Success'};

        return postBankLambda.init(event,{logger})
            .then (() => {
                return postBankLambda.impl(event,{logger})
                    .then((actual) => {
                        should(actual).eql(expectedRes);
                    })
            })
    });

    it('should test missing account', () => {
        sandbox.stub(KeyValuePairCache.prototype, 'retrievePair').returns(Promise.resolve(true));

        const postBankLambda = GenericAuthPostBankAccountLambda.Create(config);

        return postBankLambda.init(event,{logger})
            .then (() => {
                return postBankLambda.impl(event,{logger})
                    .catch((err) =>{
                        should(err.message).eql('Failed to find authorisation details for account');
                    })
            })
    });

    describe('InvokeWebHookAuthNotification', () => {
        it('Should invoke outbound webhook lambda', () => {
            const postBankLambda = GenericAuthPostBankAccountLambda.Create(config);
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
                    eventType: 'resourceCreated',
                    resourceType: 'bankAccount',
                    resourceUrl: 'NA',
                    additionalData: { externalId }
                }
            };

            return postBankLambda.invokeWebhook({logger, providerId, bankAccountId, externalId, env: 'dev03', region: 'eu-west-1'} )
                .then(() => {
                    should(invokeStub.callCount).eql(1);
                    const lambdaPayload = JSON.parse(invokeStub.getCall(0).args[0].Payload);
                    should(lambdaPayload).eql(expectedPayload);
                });
        });

        it('Should throw should a non 200 status code be returned', () => {
            const postBankLambda = GenericAuthPostBankAccountLambda.Create(config);
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

            return postBankLambda.invokeWebhook({logger, providerId, bankAccountId, externalId, env: 'dev03', region: 'eu-west-1'} )
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
