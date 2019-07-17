const MissingBankAccountsLambda = require('../../lib/MissingBankAccountsLambda');
const extractors = require('../../lib/extractors');
const ErrorSpecs = require('../../lib/ErrorSpecs');
const { DBQueries }  = require('../../lib/db')

const { Handler } = require('@sage/bc-independent-lambda-handler');
const { logger: loggerGen } = require('@sage/bc-debug-utils');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');
const { ParameterStoreStaticLoader } = require('@sage/bc-parameterstore-static-loader');
const DB = require('@sage/bc-services-db');
const S3 = require('@sage/bc-services-s3');

const sinon = require('sinon');
const should = require('should');

describe('runonce-support-missingbankaccounts.MissingBankAccountsLambda', function() {
    const logger = loggerGen(false);
    let config;
    let event;
    let sandbox;

    const stubError = () => { throw new Error('should be stubbed'); }

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        config = { OutputBucket: outputBucket = 'missing-accounts-test-bucket', Environment: env = 'test', AWS_REGION: region = 'local' };
    })

    afterEach(() => {
        sandbox.restore();
    })

    describe('constructor', () => {
        it('should create an instance of MissingBankAccountsLambda', () => {
            const actual = new MissingBankAccountsLambda({ config });
            should(actual).be.an.instanceof(MissingBankAccountsLambda);
            should(actual).be.an.instanceof(Handler);
        });

        it('should assign properties', () => {
            const actual = new MissingBankAccountsLambda({ config });
            should(actual.dbName).eql('bank_db');
        });
    });

    describe('Create', () => {
        it('should create an instance of MissingBankAccountsLambda', () => {
            const actual = MissingBankAccountsLambda.Create({ config });
            should(actual).be.an.instanceof(MissingBankAccountsLambda);
        });
    });

    describe('validate', () => {
        let uut;

        beforeEach(() => {
            uut = new MissingBankAccountsLambda({ config });
        })

        it('should throw no errors with config and event', () => {
            event = {
                bucket: 'missing-hsbc-acccount-test-bucket',
                key: 'HSBC-TEST-FILE-2.txt',
                bank: 'hsbc'
            };

            should(uut.validate(event, { logger })).be.ok();
        });

        it('should throw if there is no config', () => {
            event = {
                bucket: 'missing-hsbc-acccount-test-bucket',
                key: 'HSBC-TEST-FILE-2.txt',
                bank: 'hsbc'
            };
            
            uut.config = null;

            should(
                () => uut.validate(event, { logger })
            ).throwError(StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidConfig], ErrorSpecs.invalidConfig.statusCode));
        });

        it('should throw if there is no output bucket defined', () => {
            event = {
                bucket: 'missing-hsbc-acccount-test-bucket',
                key: 'HSBC-TEST-FILE-2.txt',
                bank: 'hsbc'
            };
            
            uut.config.OutputBucket = null;

            should(
                () => uut.validate(event, { logger })
            ).throwError(StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidConfig], ErrorSpecs.invalidConfig.statusCode));
        });

        it('should throw if there is no event', () => { 
            should(
                () => uut.validate(null, { logger })
            ).throwError(StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent.event], ErrorSpecs.invalidEvent.event.statusCode));
        });

        it('should throw if there is no bucket', () => {
            event = {
                key: 'HSBC-TEST-FILE-2.txt',
                bank: 'hsbc'
            };

            should(
                () => uut.validate(event, { logger })
            ).throwError(StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent.bucket], ErrorSpecs.invalidEvent.bucket.statusCode));
        });

        it('should throw if there is no key', () => {
            event = {
                bucket: 'missing-hsbc-acccount-test-bucket',
                bank: 'hsbc'
            };

            should(
                () => uut.validate(event, { logger })
            ).throwError(StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent.key], ErrorSpecs.invalidEvent.key.statusCode));
        });

        it('should throw if there is no bank', () => {
            event = {
                bucket: 'missing-hsbc-acccount-test-bucket',
                key: 'HSBC-TEST-FILE-2.txt',
            };

            should(
                () => uut.validate(event, { logger })
            ).throwError(StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidEvent.bank], ErrorSpecs.invalidEvent.bank.statusCode));
        });
    });

    describe('init', () => {
        let uut;

        const loader = { load: stubError };
        const db = { connect: stubError };
        const s3 = { connect: stubError };

        beforeEach(() => {
            uut = MissingBankAccountsLambda.Create({ config });
               
            event = {
                bucket: 'missing-hsbc-acccount-test-bucket',
                key: 'HSBC-TEST-FILE-2.txt',
                bank: 'hsbc'
            };            
        });

        it('should return false', () => {
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'tester' }, logger: logger}

            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(loader);
            sandbox.stub(loader, 'load').resolves({ 
                'defaultMongo.password': 'password_stub',
                'defaultMongo.replicaSet': [ 's0' ],
                'defaultMongo.username': 'user_stub',
                'defaultMongo.domain': 'domain_stub' });
            sandbox.stub(DB, 'Create').returns(db);
            sandbox.stub(S3, 'Create').returns({ value: 's3_stub' });
            sandbox.stub(db, 'connect').resolves({ value: 'db_connect' });
            
            return uut.init(event, { logger })
                .then((result) => {
                    should(result).eql(false);
                });
        });

        it('should retrieve the paramStore values', () => {
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'tester' }, logger: logger}

            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(loader);
            sandbox.stub(loader, 'load').resolves({ 
                'defaultMongo.password': 'password_stub',
                'defaultMongo.replicaSet': [ 's0' ],
                'defaultMongo.username': 'user_stub',
                'domain': 'domain_stub' });
            sandbox.stub(DB, 'Create').returns(db);
            sandbox.stub(S3, 'Create').returns(s3);
            sandbox.stub(db, 'connect').resolves({ value: 'db_connect' });

            const expectedPassword = 'password_stub';
            const expectedReplicaSet =[ 's0' ];
            const expectedUsername = 'user_stub';
            const expectedDomain = 'domain_stub';
            
            return uut.init(event, { logger })
            .then(() => {
                should(DB.Create.callCount).eql(1);
                should(DB.Create.getCall(0).args).eql([
                    { 'env': 'test', 'region': 'local', 'domain': expectedDomain, 'username': expectedUsername, 'password': expectedPassword, 'replicaSet': expectedReplicaSet, 'db': 'bank_db' }
                ]);              
            });

        });

        it('should populate the services', () => {
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'tester' }, logger: logger}

            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(loader);
            sandbox.stub(loader, 'load').resolves({ 
                'defaultMongo.password': 'password_stub',
                'defaultMongo.replicaSet': [ 's0' ],
                'defaultMongo.username': 'user_stub',
                'defaultMongo.domain': 'domain_stub' });
            sandbox.stub(DB, 'Create').returns(db);
            sandbox.stub(S3, 'Create').returns(s3);
            sandbox.stub(db, 'connect').resolves({ value: 'db_connect' });
            
            return uut.init(event, { logger })
            .then(() => {
                should(uut.services).eql({db, s3});
            });
        });

        it('should connect to the database', () => {
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'tester' }, logger: logger}

            sandbox.stub(ParameterStoreStaticLoader, 'Create').returns(loader);
            sandbox.stub(loader, 'load').resolves({ 
                'defaultMongo.password': 'password_stub',
                'defaultMongo.replicaSet': [ 's0' ],
                'defaultMongo.username': 'user_stub',
                'defaultMongo.domain': 'domain_stub' });
            sandbox.stub(DB, 'Create').returns(db);
            sandbox.stub(S3, 'Create').returns(s3);  
            sandbox.stub(db, 'connect').resolves({ value: 'db_connect' });
            
            return uut.init(event, { logger })
            .then(() => {
                should(uut.services.db.connect.callCount).eql(1);
            });
        });
        
    });

    describe('impl', () => {
        let uut;

        const services = {
            db: { getConnection: stubError }, 
            s3: { get: stubError, put: stubError }
        };

        const dbQueries = { getBankAccountsByAccountDetails: stubError }

        beforeEach(() => {
            extractors.tester = sandbox.stub();

            uut = MissingBankAccountsLambda.Create({ config });
            uut.services = services;
            
            event = {
                bucket: 'missing-hsbc-acccount-test-bucket',
                key: 'HSBC-TEST-FILE-2.txt',
                bank: 'hsbc'
                };            
        });

        it('should return undefined', () => {
            const s3FileContent = '03,00000100000001,23452523\n03,00000200000001,234293984982342\n03,00000200000002';
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'tester' }}

            sandbox.stub(services.db, 'getConnection').resolves({ value: 'db_connection' });
            sandbox.stub(DBQueries, 'Create').returns(dbQueries);
            sandbox.stub(services.s3, 'get').resolves({ Body: s3FileContent });
            extractors.tester.returns([
                { bankIdentifier: '000001', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000002' }
            ]);
            sandbox.stub(dbQueries, 'getBankAccountsByAccountDetails').resolves([
                { bankIdentifier: '000001', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000002' }
            ]);

            sandbox.stub(services.s3, 'put').resolves(undefined);

            return uut.impl(event, { logger })
                .then((result) => {
                    should(result).eql(undefined);
                });
        });

        it('should write a file to s3 containing an array of bank accounts that are present in the file and missing in the database', () => {
            const expected = 'Bank Identifier,Account Identifier\n000001,00000001\n000002,00000002';
            const s3FileContent = '03,00000100000001,23452523\n03,00000200000001,234293984982342\n03,00000200000002';
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'tester' }}

            sandbox.stub(services.db, 'getConnection').resolves({ value: 'db_connection' });
            sandbox.stub(DBQueries, 'Create').returns(dbQueries);
            sandbox.stub(services.s3, 'get').resolves({ Body: s3FileContent });
            extractors.tester.returns([
                { bankIdentifier: '000001', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000002' }
            ]);
            sandbox.stub(dbQueries, 'getBankAccountsByAccountDetails').resolves([
                { bankIdentifier: '000002', accountIdentifier: '00000001' }
            ]);
            sandbox.stub(services.s3, 'put').resolves(undefined);

            return uut.impl(event, { logger })
                .then(() => {
                    should(services.s3.put.callCount).eql(1);
                    should(services.s3.put.getCall(0).args).eql([
                        'missing-accounts-from-test_key.txt', expected, 'AES256'
                    ]);
                });
        });

        it('should write a file to s3 containing only csv headers if all bank accounts are present in the database', () => {
            const expected = 'Bank Identifier,Account Identifier';
            const s3FileContent = '03,00000100000001,23452523\n03,00000200000001,234293984982342\n03,00000200000002';
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'tester' }}

            sandbox.stub(services.db, 'getConnection').resolves({ value: 'db_connection' });
            sandbox.stub(DBQueries, 'Create').returns(dbQueries);
            sandbox.stub(services.s3, 'get').resolves({ Body: s3FileContent });
            extractors.tester.returns([
                { bankIdentifier: '000001', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000002' }
            ]);
            sandbox.stub(dbQueries, 'getBankAccountsByAccountDetails').resolves([
                { bankIdentifier: '000001', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000002' }
            ]);
            sandbox.stub(services.s3, 'put').resolves(undefined);

            return uut.impl(event, { logger })
                .then(() => {
                    should(services.s3.put.callCount).eql(1);
                    should(services.s3.put.getCall(0).args).eql([
                        'missing-accounts-from-test_key.txt', expected, 'AES256'
                    ]);
                });
        });

        it('should write a file to s3 containing a csv list of all bank accounts if none are present in the database', () => {
            const expected = 'Bank Identifier,Account Identifier\n000001,00000001\n000002,00000001\n000002,00000002';
            const s3FileContent = '03,00000100000001,23452523\n03,00000200000001,234293984982342\n03,00000200000002';
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'tester' }}

            sandbox.stub(services.db, 'getConnection').resolves({ value: 'db_connection' });
            sandbox.stub(DBQueries, 'Create').returns(dbQueries);
            sandbox.stub(services.s3, 'get').resolves({ Body: s3FileContent });
            extractors.tester.returns([
                { bankIdentifier: '000001', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000002' }
            ]);
            sandbox.stub(dbQueries, 'getBankAccountsByAccountDetails').resolves([]);
            sandbox.stub(services.s3, 'put').resolves(undefined);

            return uut.impl(event, { logger })
                .then(() => {
                    should(services.s3.put.callCount).eql(1);
                    should(services.s3.put.getCall(0).args).eql([
                        'missing-accounts-from-test_key.txt', expected, 'AES256'
                    ]);
                });
        });

        it('should write a file to s3 containing only csv headers if no bank accounts are present in the file', () => {
            const expected = 'Bank Identifier,Account Identifier';
            const s3FileContent = '02,00000100000001,23452523\n01,00000200000001,234293984982342\n04,00000200000002';
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'tester' }}

            sandbox.stub(services.db, 'getConnection').resolves({ value: 'db_connection' });
            sandbox.stub(DBQueries, 'Create').returns(dbQueries);
            sandbox.stub(services.s3, 'get').resolves({ Body: s3FileContent });
            extractors.tester.returns([]);
            sandbox.stub(dbQueries, 'getBankAccountsByAccountDetails').resolves([]);
            sandbox.stub(services.s3, 'put').resolves(undefined);

            return uut.impl(event, { logger })
                .then(() => {
                    should(services.s3.put.callCount).eql(1);
                    should(services.s3.put.getCall(0).args).eql([
                        'missing-accounts-from-test_key.txt', expected, 'AES256'
                    ]);
                });
        });

        it('should throw an error if the file is missing in s3', (done) => {

            const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.notFound.s3Error], ErrorSpecs.notFound.s3Error.statusCode);
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'tester' }}

            sandbox.stub(services.db, 'getConnection').resolves({ value: 'db_connection' });
            sandbox.stub(DBQueries, 'Create').returns(dbQueries);
            sandbox.stub(services.s3, 'get').rejects(new Error('error'));
            extractors.tester.returns([]);
            sandbox.stub(dbQueries, 'getBankAccountsByAccountDetails').resolves([]);
            sandbox.stub(services.s3, 'put').resolves(undefined);

            uut.impl(event, { logger })
            .then(() => {
                done(new Error('should have thrown'));
            })
            .catch((err) => {
                should(err).eql(expected);
                done();
            })
            .catch((err) => done(err ? err : new Error('failed')));

        });

        it('should validate and throw if the input has no Body', (done) => {
            const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidExtractorInput.body], ErrorSpecs.invalidExtractorInput.body.statusCode);
            const s3FileContent = '02,00000100000001,23452523\n01,00000200000001,234293984982342\n04,00000200000002';
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'tester' }}

            sandbox.stub(services.db, 'getConnection').resolves({ value: 'db_connection' });
            sandbox.stub(DBQueries, 'Create').returns(dbQueries);
            sandbox.stub(services.s3, 'get').resolves({ noBody: s3FileContent });
            extractors.tester.returns([]);
            sandbox.stub(dbQueries, 'getBankAccountsByAccountDetails').resolves([]);
            sandbox.stub(services.s3, 'put').resolves(undefined);

            uut.impl(event, { logger })
            .then(() => {
                done(new Error('should have thrown'));
            })
            .catch((err) => {
                should(err).eql(expected);
                done();
            })
            .catch((err) => done(err ? err : new Error('failed')));

        });

        it('should throw an error if it cannot write the file to s3', (done) => {
            const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.failedToWriteToS3], ErrorSpecs.failedToWriteToS3.statusCode);
            const s3FileContent = '03,00000100000001,23452523\n03,00000200000001,234293984982342\n03,00000200000002';
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'tester' }}

            sandbox.stub(services.db, 'getConnection').resolves({ value: 'db_connection' });
            sandbox.stub(DBQueries, 'Create').returns(dbQueries);
            sandbox.stub(services.s3, 'get').resolves({ Body: s3FileContent });
            extractors.tester.returns([
                { bankIdentifier: '000001', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000002' }
            ]);
            sandbox.stub(dbQueries, 'getBankAccountsByAccountDetails').resolves([
                { bankIdentifier: '000002', accountIdentifier: '00000001' }
            ]);
            sandbox.stub(services.s3, 'put').rejects(new Error('error'));

            uut.impl(event, { logger })
            .then(() => {
                done(new Error('should have thrown'));
            })
            .catch((err) => {
                should(err).eql(expected);
                done();
            })
            .catch((err) => done(err ? err : new Error('failed')));
        });

        it('should throw an error if it cannot read from the db', (done) => {
            const expected = StatusCodeError.CreateFromSpecs([ErrorSpecs.failedToReadDb], ErrorSpecs.failedToReadDb.statusCode);
            const s3FileContent = '03,00000100000001,23452523\n03,00000200000001,234293984982342\n03,00000200000002';
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'tester' }}

            sandbox.stub(services.db, 'getConnection').resolves({ value: 'db_connection' });
            sandbox.stub(DBQueries, 'Create').returns(dbQueries);
            sandbox.stub(services.s3, 'get').resolves({ Body: s3FileContent });
            extractors.tester.returns([
                { bankIdentifier: '000001', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000002' }
            ]);
            sandbox.stub(dbQueries, 'getBankAccountsByAccountDetails').rejects(new Error('error'));
            sandbox.stub(services.s3, 'put').resolves(undefined);

            uut.impl(event, { logger })
            .then(() => {
                done(new Error('should have thrown'));
            })
            .catch((err) => {
                should(err).eql(expected);
                done();
            })
            .catch((err) => done(err ? err : new Error('failed')));

        });

        it('should call s3.get with the correct parameters', () => {
            const s3FileContent = '03,00000100000001,23452523\n03,00000200000001,234293984982342\n03,00000200000002';
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'tester' }}

            sandbox.stub(services.db, 'getConnection').resolves({ value: 'db_connection' });
            sandbox.stub(DBQueries, 'Create').returns(dbQueries);
            sandbox.stub(services.s3, 'get').resolves({ Body: s3FileContent });
            extractors.tester.returns([
                { bankIdentifier: '000001', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000001' },
                { bankIdentifier: '000002', accountIdentifier: '00000002' }
            ]);
            sandbox.stub(dbQueries, 'getBankAccountsByAccountDetails').resolves([
                { bankIdentifier: '000002', accountIdentifier: '00000001' }
            ]);
            sandbox.stub(services.s3, 'put').resolves(undefined);

            return uut.impl(event, { logger })
                .then(() => {
                    should(services.s3.get.callCount).eql(1);
                    should(services.s3.get.getCall(0).args).eql(['test_key', 'test_bucket']);
                });
        });
    });
})
