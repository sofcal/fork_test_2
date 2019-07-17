const MissingBankAccountsLambda = require('../../lib/MissingBankAccountsLambda');
const { DBQueries }  = require('../../lib/db')

const { logger: loggerGen } = require('@sage/bc-debug-utils');

const sinon = require('sinon');
const should = require('should');

describe('runonce-support-missingbankaccounts.HSBCExtractorIntegration', function() {
    const logger = loggerGen(false);
    let config;
    let sandbox;

    const stubError = () => { throw new Error('should be stubbed'); }

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        config = { OutputBucket: outputBucket = 'missing-accounts-test-bucket', Environment: env = 'test', AWS_REGION: region = 'local' };
    })

    afterEach(() => {
        sandbox.restore();
    })

    describe('impl', () => {
        let uut;

        const services = {
            db: { getConnection: stubError }, s3: { get: stubError, put: stubError }
        };

        const dbQueries = {
            getBankAccountsByAccountDetails: stubError
        }

        beforeEach(() => {
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
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'hsbc' }}

            sandbox.stub(services.db, 'getConnection').resolves({ value: 'db_connection' });
            sandbox.stub(DBQueries, 'Create').returns(dbQueries);
            sandbox.stub(services.s3, 'get').resolves({ Body: s3FileContent });
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
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'hsbc' }}

            sandbox.stub(services.db, 'getConnection').resolves({ value: 'db_connection' });
            sandbox.stub(DBQueries, 'Create').returns(dbQueries);
            sandbox.stub(services.s3, 'get').resolves({ Body: s3FileContent });
            sandbox.stub(dbQueries, 'getBankAccountsByAccountDetails').resolves([
                { bankIdentifier: '000002', accountIdentifier: '00000001' }
            ]);
            sandbox.stub(services.s3, 'put').resolves(undefined);

            return uut.impl(event, { logger })
                .then(() => {
                    should(services.s3.put.callCount).eql(1);
                    should(services.s3.put.getCall(0).args).eql([
                        'missing-accounts-from-test_key.csv', expected, 'AES256'
                    ]);
                });
        });

        it('should write a file to s3 containing only csv headers if all bank accounts are present in the database', () => {
            const expected = 'Bank Identifier,Account Identifier';
            const s3FileContent = '03,00000100000001,23452523\n03,00000200000001,234293984982342\n03,00000200000002';
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'hsbc' }}

            sandbox.stub(services.db, 'getConnection').resolves({ value: 'db_connection' });
            sandbox.stub(DBQueries, 'Create').returns(dbQueries);
            sandbox.stub(services.s3, 'get').resolves({ Body: s3FileContent });
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
                        'missing-accounts-from-test_key.csv', expected, 'AES256'
                    ]);
                });
        });

        it('should write a file to s3 containing a csv list of all bank accounts if none are present in the database', () => {
            const expected = 'Bank Identifier,Account Identifier\n000001,00000001\n000002,00000001\n000002,00000002';
            const s3FileContent = '03,00000100000001,23452523\n03,00000200000001,234293984982342\n03,00000200000002';
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'hsbc' }}

            sandbox.stub(services.db, 'getConnection').resolves({ value: 'db_connection' });
            sandbox.stub(DBQueries, 'Create').returns(dbQueries);
            sandbox.stub(services.s3, 'get').resolves({ Body: s3FileContent });
            sandbox.stub(dbQueries, 'getBankAccountsByAccountDetails').resolves([]);
            sandbox.stub(services.s3, 'put').resolves(undefined);

            return uut.impl(event, { logger })
                .then(() => {
                    should(services.s3.put.callCount).eql(1);
                    should(services.s3.put.getCall(0).args).eql([
                        'missing-accounts-from-test_key.csv', expected, 'AES256'
                    ]);
                });
        });

        it('should write a file to s3 containing only csv headers if no bank accounts are present in the file', () => {
            const expected = 'Bank Identifier,Account Identifier';
            const s3FileContent = '02,00000100000001,23452523\n01,00000200000001,234293984982342\n04,00000200000002';
            const event = { parsed: { bucket: 'test_bucket', key: 'test_key', bank: 'hsbc' }}

            sandbox.stub(services.db, 'getConnection').resolves({ value: 'db_connection' });
            sandbox.stub(DBQueries, 'Create').returns(dbQueries);
            sandbox.stub(services.s3, 'get').resolves({ Body: s3FileContent });
            sandbox.stub(dbQueries, 'getBankAccountsByAccountDetails').resolves([]);
            sandbox.stub(services.s3, 'put').resolves(undefined);

            return uut.impl(event, { logger })
                .then(() => {
                    should(services.s3.put.callCount).eql(1);
                    should(services.s3.put.getCall(0).args).eql([
                        'missing-accounts-from-test_key.csv', expected, 'AES256'
                    ]);
                });
        });

    });
})
