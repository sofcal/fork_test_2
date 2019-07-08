const MissingBankAccountsLambda = require('../../lib/MissingBankAccountsLambda');
const extractors = require('../../lib/extractors');
const ErrorSpecs = require('../../lib/ErrorSpecs');
const { DBQueries }  = require('../../lib/db')

const { Handler } = require('@sage/bc-independent-lambda-handler');
const { logger: loggerGen } = require('@sage/bc-debug-utils');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');

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
        // event = { logger };
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

    describe.skip('init', () => {
        
    });

    describe('impl', () => {
        let uut;

        const services = {
            db: { getConnection: stubError }, s3: { get: stubError, put: stubError }
        };

        const dbQueries = {
            getBankAccountsByAccountDetails: stubError
        }

        beforeEach(() => {
            extractors.tester = sandbox.stub();

            uut = MissingBankAccountsLambda.Create({ config });
            uut.services = services;
            
            event = {
                bucket: 'missing-hsbc-acccount-test-bucket',
                key: 'HSBC-TEST-FILE-2.txt',
                bank: 'hsbc'
                };
            
                // sandbox.stub
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
            throw new Error('not implemented yet');
        });

        it('should throw an error if the file is missing in s3', () => {
            throw new Error('not implemented yet');
        });

        it('should validate and throw if the input has no Body', () => {
            
            throw new Error('incomplete implementation');
            
            const bankFileNoBody = {
                AcceptRanges: 'bytes',
                LastModified: '2019-06-17T11:11:43.000Z',
                ContentLength: 75448,
                ETag: '"d723470fd74d56b9e2fdea9aa9aff9e1"',
                ContentType: 'text/plain',
                Metadata: {}
            }
    
            should(
                () => hsbc(bankFileNoBody)
            ).throwError(StatusCodeError.CreateFromSpecs([ErrorSpecs.invalidExtractorInput.body], ErrorSpecs.invalidExtractorInput.body.statusCode));
        });

        it('should throw an error if it cannot write the file to s3', () => {
            throw new Error('not implemented yet');
        });

        it('should throw an error if it cannot read from the db', () => {
            throw new Error('not implemented yet');
        });

        it('should call s3.get with the correct parameters', () => {
            throw new Error('not implemented yet')
        });

        // already tested fully in the functional tests
        // it('should call s3.put with the correct parameters', () => {
        //     throw new Error('not implemented yet')
        // });

        it(';should call db.getConnection with the correct parameters', () => {

        })

        // it('should  return something', () => {
        //     event = {
        //         bucket: 'missing-hsbc-acccount-test-bucket',
        //         key: 'HSBC-TEST-FILE-2.txt',
        //         bank: 'hsbc'
        //         };

        //     uut.impl(event, logger).should.be.ok();
        // });

        it('should create the database connection', () => {
            throw new Error('not implemented yet');
            //no
        });

        it('retrieve the file from s3', () => {
            //no
            throw new Error('not implemented yet');

        });

        it('should throw an error if there is no file at the location specified', () => {
            throw new Error('not implemented yet');
            // yes .. not a test for this unit?
        });

        it('should throw an error if no accounts are found in the file', () => {
            throw new Error('not implemented yet');
            // yes
        });

        it('should get the correct account details from the database call', () => {
            throw new Error('not implemented yet');
            // how would I test this?
        });

        it('should return the accounts in the bank file but not in the database', () => {
            throw new Error('not implemented yet');
            // how would I test this?
        });

        it('should print the results to a file in s3', () => {
            throw new Error('not implemented yet');
            // how would I test this?
        });
    });
})
