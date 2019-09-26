const FileDescriptors = require('../../lib/FileDescriptors');
const should = require('should');
const Bank = require('../../lib/Bank');
const sinon = require('sinon');

describe('@sage/bc-bank.FileDescriptors', () => {
    let data;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        const uuid = 'd73ebc4a-654b-4e87-ae35-b37fc562de06';
        const name = 'bank_name';
        const primaryCountry = 'GBR';
        const primaryCountry2CharIso = 'GB';
        const authorisationMechanism = 'web';
        const authorisationData = 'http://www.google.com';
        const bankIdentifier = '042000013';
        const topicName = 'topic_name';
        const path = 'path';
        const dataProvider = Bank.dataProviders.direct;
        const accountTypes = [
            {
                name: 'Checking',
                mandatoryCustomerBankDetails: [
                    {
                        name: 'bank_specific_field',
                        value: 'bank_specific_value',
                        validation: '^.{1,128}$',
                        isAmendable: true
                    }
                ]
            },
            {
                name: 'Savings',
                mandatoryCustomerBankDetails: [
                    {
                        name: 'bank_specific_field',
                        value: 'bank_specific_value',
                        validation: '^.{1,128}$',
                        isAmendable: false
                    }
                ]
            }
        ];
        const status = 'supported';
        const internalStatuses = [Bank.internalStatusValues.clientDataFlowBlocked];
        const address = '1 Bank Street, Financial District, Bank Town, BA11 NK11';
        const emailAddress = 'hello@usbank.com';
        const agreement = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
        const quarantine = { forceQuarantine: false, transactionTypes: [] };
        const proxy = { bankName: 'parent_bank_name', bankId: 'd73ebc4a-2222-2222-2222-222222222222' };
        const offBoarding = {
            type: Bank.offBoardingTypes.email,
            instructions: 'This is what you do...',
            emailAddress: 'cancel@mybank.com',
            emailTitle: 'Cancellation Request'
        };
        data = {
            uuid,
            name,
            primaryCountry,
            primaryCountry2CharIso,
            authorisationMechanism,
            authorisationData,
            bankIdentifier,
            topicName,
            path,
            accountTypes,
            status,
            internalStatuses,
            address,
            emailAddress,
            agreement,
            dataProvider,
            quarantine,
            offBoardingMechanism: offBoarding,
            proxy,
            supportiframe: false,
            recentFileHistory: []
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should be able to create an instance of FileDescriptors', () => {
            const file = new FileDescriptors('test');
            should(file).be.an.instanceOf(FileDescriptors);
            should(file).have.property('bank', 'test');
        });
    });

    describe('prune', () => {
        it('should leave fileUnique entries that are within age restriction', (done) => {
            const bank = new Bank(data);
            const now = new Date();

            sandbox.useFakeTimers(now);

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now }
            ];

            bank.recentFileDescriptors().prune();

            should(bank.recentFileHistory).eql([
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now }
            ]);

            done();
        });

        it('should remove fileUnique entries that are older than age restriction ', (done) => {
            const bank = new Bank(data);
            const now = new Date();
            const nowMs = now.getTime();
            const nowMinus30 = new Date(nowMs);
            const nowMinus59 = new Date(nowMs);
            const nowMinus60 = new Date(nowMs);
            const nowMinus61 = new Date(nowMs);

            sandbox.useFakeTimers(now);

            nowMinus30.setDate(nowMinus30.getDate() - 30);
            nowMinus30.setHours(0, 0, 0, 0);
            nowMinus59.setDate(nowMinus59.getDate() - 59);
            nowMinus59.setHours(0, 0, 0, 0);
            nowMinus60.setDate(nowMinus60.getDate() - 60);
            nowMinus60.setHours(0, 0, 0, 0);
            nowMinus61.setDate(nowMinus61.getDate() - 61);
            nowMinus61.setHours(0, 0, 0, 0);

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus60 },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: nowMinus30 },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: nowMinus59 },
                { fileName: 'file_4.txt', fileId: 'file_id_4', timestamp: nowMinus61 }
            ];

            bank.recentFileDescriptors().prune(60);

            should(bank.recentFileHistory).eql([
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus60 },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: nowMinus30 },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: nowMinus59 }
            ]);

            done();
        });

        it('should default to 30 days', (done) => {
            const bank = new Bank(data);
            const now = new Date();
            const nowMs = now.getTime();
            const nowMinus30 = new Date(nowMs);
            const nowMinus59 = new Date(nowMs);
            const nowMinus60 = new Date(nowMs);
            const nowMinus61 = new Date(nowMs);

            sandbox.useFakeTimers(now);

            nowMinus30.setDate(nowMinus30.getDate() - 30);
            nowMinus30.setHours(0, 0, 0, 0);
            nowMinus59.setDate(nowMinus59.getDate() - 59);
            nowMinus59.setHours(0, 0, 0, 0);
            nowMinus60.setDate(nowMinus60.getDate() - 60);
            nowMinus60.setHours(0, 0, 0, 0);
            nowMinus61.setDate(nowMinus61.getDate() - 61);
            nowMinus61.setHours(0, 0, 0, 0);

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus60 },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: nowMinus30 },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: nowMinus59 },
                { fileName: 'file_4.txt', fileId: 'file_id_4', timestamp: nowMinus61 }
            ];

            bank.recentFileDescriptors().prune();

            should(bank.recentFileHistory).eql([
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: nowMinus30 }
            ]);

            done();
        });

        it('should not remove currently quarantined files even if past the threshold', (done) => {
            const bank = new Bank(data);
            const now = new Date();
            const nowMs = now.getTime();
            const nowMinus30 = new Date(nowMs);
            const nowMinus59 = new Date(nowMs);
            const nowMinus60 = new Date(nowMs);
            const nowMinus61 = new Date(nowMs);

            sandbox.useFakeTimers(now);

            nowMinus30.setDate(nowMinus30.getDate() - 30);
            nowMinus30.setHours(0, 0, 0, 0);
            nowMinus59.setDate(nowMinus59.getDate() - 59);
            nowMinus59.setHours(0, 0, 0, 0);
            nowMinus60.setDate(nowMinus60.getDate() - 60);
            nowMinus60.setHours(0, 0, 0, 0);
            nowMinus61.setDate(nowMinus61.getDate() - 61);
            nowMinus61.setHours(0, 0, 0, 0);

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus60, quarantine: { isQuarantined: false, releaseDate: new Date() } },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: nowMinus30 },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: nowMinus59 },
                { fileName: 'file_4.txt', fileId: 'file_id_4', timestamp: nowMinus61, quarantine: { isQuarantined: true } }
            ];

            bank.recentFileDescriptors().prune();

            should(bank.recentFileHistory).eql([
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: nowMinus30 },
                { fileName: 'file_4.txt', fileId: 'file_id_4', timestamp: nowMinus61, quarantine: { isQuarantined: true } }
            ]);

            done();
        });
    });

    describe('pruneByFileName', () => {
        it('should prune a single item that matches the regex', (done) => {
            const bank = new Bank(data);
            const now = new Date();

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now }
            ];

            bank.recentFileDescriptors().pruneByFileName(new RegExp('.*file_2.*'));

            should(bank.recentFileHistory).eql([
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now }
            ]);

            done();
        });

        it('should prune a multiple items that match the regex', (done) => {
            const bank = new Bank(data);
            const now = new Date();

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now },
                { fileName: 'file_match_1.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_match_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_match_3.txt', fileId: 'file_id_3', timestamp: now }
            ];

            bank.recentFileDescriptors().pruneByFileName(new RegExp('.*match*'));

            should(bank.recentFileHistory).eql([
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now }
            ]);

            done();
        });

        it('should return a single pruned item', (done) => {
            const bank = new Bank(data);
            const now = new Date();

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now }
            ];

            const actual = bank.recentFileDescriptors().pruneByFileName(new RegExp('.*file_2.*'));

            should(actual).eql([{ fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now }]);

            done();
        });

        it('should return multiple pruned items', (done) => {
            const bank = new Bank(data);
            const now = new Date();

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now },
                { fileName: 'file_match_1.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_match_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_match_3.txt', fileId: 'file_id_3', timestamp: now }
            ];

            const actual = bank.recentFileDescriptors().pruneByFileName(new RegExp('.*match*'));

            should(actual).eql([
                { fileName: 'file_match_1.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_match_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_match_3.txt', fileId: 'file_id_3', timestamp: now }
            ]);

            done();
        });

        it('should not modify the recentFileHistory if the arg is not a RegExp', (done) => {
            const bank = new Bank(data);
            const now = new Date();

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now }
            ];

            bank.recentFileDescriptors().pruneByFileName('.*file_2.*');

            should(bank.recentFileHistory).eql([
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now }
            ]);

            done();
        });

        it('should not modify the recentFileHistory if the arg is null', (done) => {
            const bank = new Bank(data);
            const now = new Date();

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now }
            ];

            bank.recentFileDescriptors().pruneByFileName(null);

            should(bank.recentFileHistory).eql([
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now }
            ]);

            done();
        });

        it('should not modify the recentFileHistory if the arg is undefined', (done) => {
            const bank = new Bank(data);
            const now = new Date();

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now }
            ];

            bank.recentFileDescriptors().pruneByFileName(undefined);

            should(bank.recentFileHistory).eql([
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now }
            ]);

            done();
        });
    });

    describe('getInQuarantine', () => {
        it('should return the fileDescriptors that are in quarantine', (done) => {
            const bank = new Bank(data);
            const now = new Date();

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now, quarantine: { isQuarantined: true } }
            ];

            const actual = bank.recentFileDescriptors().getInQuarantine();

            should(actual).eql([
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now, quarantine: { isQuarantined: true } }
            ]);

            done();
        });

        it('should not include fileDescriptors that were quarantined but have been released', (done) => {
            const bank = new Bank(data);
            const now = new Date();

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now, quarantine: { isQuarantined: false, releaseDate: now } }
            ];

            const actual = bank.recentFileDescriptors().getInQuarantine();

            should(actual).eql([
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now, quarantine: { isQuarantined: true } }
            ]);

            done();
        });

        it('should return an empty array if there are no fileDescriptors', (done) => {
            const bank = new Bank(data);

            bank.recentFileHistory = [];

            const actual = bank.recentFileDescriptors().getInQuarantine();

            should(actual).eql([]);

            done();
        });

        it('should return an empty array if there are no fileDescriptors in quarantine', (done) => {
            const bank = new Bank(data);
            const now = new Date();

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now, quarantine: { isQuarantined: false, releaseDate: now } }
            ];

            const actual = bank.recentFileDescriptors().getInQuarantine();

            should(actual).eql([]);

            done();
        });
    });

    describe('getInPeriod', () => {
        it('should return fileDescriptors within the period', (done) => {
            const bank = new Bank(data);
            const now = new Date();
            const nowMs = now.getTime();
            const nowMinus120000ms = nowMs - (12 * 60 * 60 * 1000);
            const nowMinus125959ms = nowMinus120000ms + 1000;
            const nowMinus120001ms = nowMinus120000ms - 1000;
            const nowMinus125959 = new Date(nowMinus125959ms);
            const nowMinus120000 = new Date(nowMinus120000ms);
            const nowMinus120001 = new Date(nowMinus120001ms);

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus125959 },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: nowMinus120000 },
                { fileName: 'file_4.txt', fileId: 'file_id_4', timestamp: nowMinus120001 }
            ];

            sandbox.useFakeTimers(now);

            const actual = bank.recentFileDescriptors().getInPeriod(12);

            should(actual).eql([
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus125959 }
            ]);

            done();
        });

        it('should default to 24 hours', (done) => {
            const bank = new Bank(data);
            const now = new Date();
            const nowMs = now.getTime();
            const nowMinus240000ms = nowMs - (24 * 60 * 60 * 1000);
            const nowMinus235959ms = nowMinus240000ms + 1000;
            const nowMinus240001ms = nowMinus240000ms - 1000;
            const nowMinus235959 = new Date(nowMinus235959ms);
            const nowMinus240000 = new Date(nowMinus240000ms);
            const nowMinus240001 = new Date(nowMinus240001ms);

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus235959 },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: nowMinus240000 },
                { fileName: 'file_4.txt', fileId: 'file_id_4', timestamp: nowMinus240001 }
            ];

            sandbox.useFakeTimers(now);

            const actual = bank.recentFileDescriptors().getInPeriod();

            should(actual).eql([
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus235959 }
            ]);

            done();
        });
    });

    describe('getLatest', () => {
        it('should return the most recent', (done) => {
            const bank = new Bank(data);
            const now = new Date();
            const nowMs = now.getTime();
            const nowMinus12 = new Date(nowMs - (12 * 60 * 60 * 1000));
            const nowMinus24 = new Date(nowMs - (24 * 60 * 60 * 1000));

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus12 },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now },
                { fileName: 'file_4.txt', fileId: 'file_id_4', timestamp: nowMinus24 }
            ];

            const actual = bank.recentFileDescriptors().getLatest();

            should(actual).eql({
                fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now
            });

            done();
        });

        it('should return undefined if there is no history', (done) => {
            const bank = new Bank(data);

            bank.recentFileHistory = [];

            const actual = bank.recentFileDescriptors().getLatest();

            should(actual).eql(undefined);

            done();
        });
    });

    describe('getEarliestQuarantined', () => {
        it('should return the earliest quarantined file', (done) => {
            const bank = new Bank(data);
            const now = new Date();
            const nowMs = now.getTime();
            const nowMinus12 = new Date(nowMs - (12 * 60 * 60 * 1000));
            const nowMinus24 = new Date(nowMs - (24 * 60 * 60 * 1000));

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus12, quarantine: { isQuarantined: true } },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file_4.txt', fileId: 'file_id_4', timestamp: nowMinus24 }
            ];

            const actual = bank.recentFileDescriptors().getEarliestQuarantined();

            should(actual).eql({
                fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus12, quarantine: { isQuarantined: true }
            });

            done();
        });

        it('should return undefined if there are no quarantined files', (done) => {
            const bank = new Bank(data);
            const now = new Date();
            const nowMs = now.getTime();
            const nowMinus12 = new Date(nowMs - (12 * 60 * 60 * 1000));
            const nowMinus24 = new Date(nowMs - (24 * 60 * 60 * 1000));

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus12, quarantine: { isQuarantined: false } },
                { fileName: 'file_2.txt', fileId: 'file_id_2', timestamp: now, quarantine: { isQuarantined: false } },
                { fileName: 'file_4.txt', fileId: 'file_id_4', timestamp: nowMinus24 }
            ];

            const actual = bank.recentFileDescriptors().getEarliestQuarantined();

            should(actual).eql(undefined);

            done();
        });

        it('should return undefined if there are no files', (done) => {
            const bank = new Bank(data);

            bank.recentFileHistory = [];

            const actual = bank.recentFileDescriptors().getEarliestQuarantined();

            should(actual).eql(undefined);

            done();
        });
    });

    describe('getByFileName', () => {
        it('should return the file with matching name', (done) => {
            const bank = new Bank(data);
            const now = new Date();
            const nowMs = now.getTime();
            const nowMinus12 = new Date(nowMs - (12 * 60 * 60 * 1000));
            const nowMinus24 = new Date(nowMs - (24 * 60 * 60 * 1000));

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus12, quarantine: { isQuarantined: true } },
                { fileName: 'file_1.csv', fileId: 'file_id_2', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file-1.txt', fileId: 'file_id_4', timestamp: nowMinus24 },
                { fileName: 'file-1.tx', fileId: 'file_id_4', timestamp: now },
                { fileName: 'file-1.txts', fileId: 'file_id_4', timestamp: now }
            ];

            const actual = bank.recentFileDescriptors().getByFileName('file_1.txt');

            should(actual).eql({
                fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus12, quarantine: { isQuarantined: true }
            });

            done();
        });

        it('should return undefined if the file does not exist', (done) => {
            const bank = new Bank(data);
            const now = new Date();
            const nowMs = now.getTime();
            const nowMinus12 = new Date(nowMs - (12 * 60 * 60 * 1000));
            const nowMinus24 = new Date(nowMs - (24 * 60 * 60 * 1000));

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus12, quarantine: { isQuarantined: true } },
                { fileName: 'file_1.csv', fileId: 'file_id_2', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file-1.txt', fileId: 'file_id_4', timestamp: nowMinus24 },
                { fileName: 'file-1.tx', fileId: 'file_id_4', timestamp: now },
                { fileName: 'file-1.txts', fileId: 'file_id_4', timestamp: now }
            ];

            const actual = bank.recentFileDescriptors().getByFileName('file_1.txtx');

            should(actual).eql(undefined);

            done();
        });

        it('should return undefined if there are no files', (done) => {
            const bank = new Bank(data);

            bank.recentFileHistory = [];

            const actual = bank.recentFileDescriptors().getByFileName('file_1.txt');

            should(actual).eql(undefined);

            done();
        });
    });

    describe('get', () => {
        it('should return the file with matching id', (done) => {
            const bank = new Bank(data);
            const now = new Date();
            const nowMs = now.getTime();
            const nowMinus12 = new Date(nowMs - (12 * 60 * 60 * 1000));
            const nowMinus24 = new Date(nowMs - (24 * 60 * 60 * 1000));

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus12, quarantine: { isQuarantined: true } },
                { fileName: 'file_1.csv', fileId: 'file_id_11', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file-1.txt', fileId: 'file_id-1', timestamp: nowMinus24 },
                { fileName: 'file-1.tx', fileId: 'file_id_', timestamp: now },
                { fileName: 'file-1.tx', fileId: 'file_id_1.', timestamp: now }
            ];

            const actual = bank.recentFileDescriptors().get('file_id_1');

            should(actual).eql({
                fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus12, quarantine: { isQuarantined: true }
            });

            done();
        });

        it('should return undefined if the file id does not exist', (done) => {
            const bank = new Bank(data);
            const now = new Date();
            const nowMs = now.getTime();
            const nowMinus12 = new Date(nowMs - (12 * 60 * 60 * 1000));
            const nowMinus24 = new Date(nowMs - (24 * 60 * 60 * 1000));

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus12, quarantine: { isQuarantined: true } },
                { fileName: 'file_1.csv', fileId: 'file_id_11', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file-1.txt', fileId: 'file_id-1', timestamp: nowMinus24 },
                { fileName: 'file-1.tx', fileId: 'file_id_', timestamp: now },
                { fileName: 'file-1.tx', fileId: 'file_id_1.', timestamp: now }
            ];

            const actual = bank.recentFileDescriptors().get('file_id_111');

            should(actual).eql(undefined);

            done();
        });

        it('should return undefined if there are no files', (done) => {
            const bank = new Bank(data);

            bank.recentFileHistory = [];

            const actual = bank.recentFileDescriptors().get('file_id_1');

            should(actual).eql(undefined);

            done();
        });
    });

    describe('exists', () => {
        it('should return true if the a file with matching id exists', (done) => {
            const bank = new Bank(data);
            const now = new Date();
            const nowMs = now.getTime();
            const nowMinus12 = new Date(nowMs - (12 * 60 * 60 * 1000));
            const nowMinus24 = new Date(nowMs - (24 * 60 * 60 * 1000));

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus12, quarantine: { isQuarantined: true } },
                { fileName: 'file_1.csv', fileId: 'file_id_11', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file-1.txt', fileId: 'file_id-1', timestamp: nowMinus24 },
                { fileName: 'file-1.tx', fileId: 'file_id_', timestamp: now },
                { fileName: 'file-1.tx', fileId: 'file_id_1.', timestamp: now }
            ];

            const actual = bank.recentFileDescriptors().exists('file_id_1');

            should(actual).eql(true);

            done();
        });

        it('should return false if the file does not exist', (done) => {
            const bank = new Bank(data);
            const now = new Date();
            const nowMs = now.getTime();
            const nowMinus12 = new Date(nowMs - (12 * 60 * 60 * 1000));
            const nowMinus24 = new Date(nowMs - (24 * 60 * 60 * 1000));

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: nowMinus12, quarantine: { isQuarantined: true } },
                { fileName: 'file_1.csv', fileId: 'file_id_11', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file-1.txt', fileId: 'file_id-1', timestamp: nowMinus24 },
                { fileName: 'file-1.tx', fileId: 'file_id_', timestamp: now },
                { fileName: 'file-1.tx', fileId: 'file_id_1.', timestamp: now }
            ];

            const actual = bank.recentFileDescriptors().exists('file_id_111');

            should(actual).eql(false);

            done();
        });

        it('should return false if there are no files', (done) => {
            const bank = new Bank(data);

            bank.recentFileHistory = [];

            const actual = bank.recentFileDescriptors().exists('file_id_1');

            should(actual).eql(false);

            done();
        });
    });

    describe('add', () => {
        it('should add a new file descriptor to exising list', (done) => {
            const bank = new Bank(data);
            const now = new Date();

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file_2.csv', fileId: 'file_id_2', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now }
            ];

            const actual = bank.recentFileDescriptors().add('file_id_4', 'file_4.txt');

            should(actual).eql({ fileId: 'file_id_4', fileName: 'file_4.txt' });

            done();
        });

        it('should add a new file descriptor where no exising list', (done) => {
            const bank = new Bank(data);

            bank.recentFileHistory = undefined;

            const actual = bank.recentFileDescriptors().add('file_id_4', 'file_4.txt');

            should(actual).eql({ fileId: 'file_id_4', fileName: 'file_4.txt' });

            done();
        });

        it('should throw an error if the file already exists', (done) => {
            const bank = new Bank(data);
            const now = new Date();

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file_2.csv', fileId: 'file_id_2', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file_3.txt', fileId: 'file_id_3', timestamp: now }
            ];

            try {
                bank.recentFileDescriptors().add('file_id_3', 'file_3.txt');

                done(new Error('should have thrown'));
            } catch (err) {
                should(err).eql(new Error('Bank: file descriptor already exists'));
                done();
            }
        });
    });

    describe('update', () => {
        it('should update the file descriptor', (done) => {
            const bank = new Bank(data);
            const now = new Date();

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file_2.csv', fileId: 'file_id_2', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file_3.txt', fileId: 'file_id_3' }
            ];

            const actual = bank.recentFileDescriptors().update('file_id_3', { fileName: 'file_3.txt', timestamp: now, quarantine: { isQuarantined: true } });

            should(actual).eql({ fileId: 'file_id_3', fileName: 'file_3.txt', timestamp: now, quarantine: { isQuarantined: true } });

            done();
        });

        it('should not be possible to overwrite the fileId', (done) => {
            const bank = new Bank(data);
            const now = new Date();

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file_2.csv', fileId: 'file_id_2', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file_3.txt', fileId: 'file_id_3' }
            ];

            const actual = bank.recentFileDescriptors().update('file_id_3', { fileId: 'incorrect', fileName: 'file_3.txt', timestamp: now, quarantine: { isQuarantined: true } });

            should(actual).eql({ fileId: 'file_id_3', fileName: 'file_3.txt', timestamp: now, quarantine: { isQuarantined: true } });

            done();
        });

        it('should throw an error if the file does not exist', (done) => {
            const bank = new Bank(data);
            const now = new Date();

            bank.recentFileHistory = [
                { fileName: 'file_1.txt', fileId: 'file_id_1', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file_2.csv', fileId: 'file_id_2', timestamp: now, quarantine: { isQuarantined: true } },
                { fileName: 'file_3.txt', fileId: 'file_id_3' }
            ];

            try {
                bank.recentFileDescriptors().update('file_id_4', { fileName: 'file_3.txt', timestamp: now, quarantine: { isQuarantined: true } });

                done(new Error('should have thrown'));
            } catch (err) {
                should(err).eql(new Error('Bank: file descriptor does not exist'));
                done();
            }
        });
    });
});
