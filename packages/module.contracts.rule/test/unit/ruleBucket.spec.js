'use strict';

const RuleBucket = require('../../lib/RuleBucket');
const Rule = require('../../lib/Rule');

const { StatusCodeError } = require('@sage/bc-statuscodeerror');

const should = require('should');
const sinon = require('sinon');
const _ = require('underscore');

describe('@sage/bc-contracts-rule.RuleBucket', () => {
    let sandbox;
    let data;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        data = {
            uuid: '7d77e215-50c5-4765-93cd-74f1756a56dd',
            region: 'GBR',
            organisationId: '96616525-c5a3-4958-b1ee-fb856fd83403',
            bankAccountId: '5c94f4b7-bf84-418f-a6c6-a26349034a81',
            numberOfRules: 1,
            rules: [
                {
                    uuid: '2a867f21-cf12-48f2-914f-5a741e719b27',
                    ruleName: 'New rule',
                    ruleRank: 1,
                    ruleConditions: [{
                        ruleField: 'transactionAmount',
                        ruleOperation: 'gt',
                        ruleCriteria: '10'
                    }],
                    ruleActions: [{
                        splitPercentage: 100,
                        accountantNarrative: 'New rule narrative',
                        accountsPostings: [{
                            type: 'customer',
                            code: 'CUST1'
                        }]
                    }],
                    ruleCounts: {
                        applied: 0,
                        fail: 1,
                        success: 0
                    },
                    status: 'active',
                    targetType: 'Transaction',
                    ruleType: 'User',
                    globalRuleId: undefined
                }],
            isAccountOwnerRules: false
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('contract.RuleBucket', () => {
        it('should create an instance of RuleBucket using Create', (done) => {
            try {
                const newRuleBucket = RuleBucket.Create(data);
                newRuleBucket.should.be.instanceof(RuleBucket);
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should assign properties using Create', (done) => {
            try {
                const newRuleBucket = RuleBucket.Create(data);
                should(newRuleBucket.uuid).eql(data.uuid);
                should(newRuleBucket.region).eql(data.region);
                should(newRuleBucket.organisationId).eql(data.organisationId);
                should(newRuleBucket.bankAccountId).eql(data.bankAccountId);
                should(newRuleBucket.numberOfRules).eql(data.numberOfRules);
                should(newRuleBucket.rules).eql([new Rule(data.rules[0])]);
                should(newRuleBucket.isAccountOwnerRules).eql(data.isAccountOwnerRules);
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should create an instance of RuleBucket', (done) => {
            try {
                const newRuleBucket = new RuleBucket(data);
                newRuleBucket.should.be.instanceof(RuleBucket);
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should assign properties', (done) => {
            try {
                const newRuleBucket = new RuleBucket(data);
                should(newRuleBucket.uuid).eql(data.uuid);
                should(newRuleBucket.region).eql(data.region);
                should(newRuleBucket.organisationId).eql(data.organisationId);
                should(newRuleBucket.bankAccountId).eql(data.bankAccountId);
                should(newRuleBucket.numberOfRules).eql(data.numberOfRules);
                should(newRuleBucket.rules).eql([new Rule(data.rules[0])]);
                should(newRuleBucket.isAccountOwnerRules).eql(data.isAccountOwnerRules);
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should not assign properties not on contract', (done) => {
            try {
                data.junk = 'wahwahwah';
                const newRuleBucket = new RuleBucket(data);
                should.not.exists(newRuleBucket.junk);
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('RuleBucket.prototype.validate', () => {
        it('should call RuleBucket.validate', (done) => {
            sandbox.stub(RuleBucket, 'validate');

            try {
                const newRuleBucket = new RuleBucket(data);
                RuleBucket.validate(newRuleBucket);

                RuleBucket.validate.callCount.should.eql(1);
                RuleBucket.validate.calledWithExactly(newRuleBucket).should.eql(true);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('RuleBucket.validate', () => {
        let newRuleBucket;

        beforeEach(() => {
            newRuleBucket = new RuleBucket(data);
        });

        it('should validate and throw', (done) => {
            try {
                delete newRuleBucket.region;
                newRuleBucket.validate();

                done(new Error('should have thrown'));
            } catch (err) {
                err.should.be.instanceOf(StatusCodeError);
                err.statusCode.should.eql(400);
                err.items[0].applicationCode.should.eql('InvalidProperties');
                done();
            }
        });

        it('should validate and not throw', (done) => {
            try {
                delete newRuleBucket.region;
                const response = newRuleBucket.validate(true);
                response[0].applicationCode.should.eql('InvalidProperties');
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should not throw for valid data', (done) => {
            try {
                RuleBucket.validate(newRuleBucket);
                done();
            } catch (err) {
                console.log(err);
                done((err instanceof Error) ? err : new Error());
            }
        });

        it('should throw if ruleBucket is undefined', (done) => {
            try {
                RuleBucket.validate(undefined);
                done(new Error('should have thrown'));
            } catch (err) {

                err.should.be.instanceOf(StatusCodeError);
                err.statusCode.should.eql(400);
                err.items[0].applicationCode.should.eql('InvalidType');

                done();
            }
        });

        it('should throw if ruleBucket is null', (done) => {
            try {
                RuleBucket.validate(null);
                done(new Error('should have thrown'));
            } catch (err) {
                err.should.be.instanceof(StatusCodeError);
                err.statusCode.should.eql(400);
                err.items[0].applicationCode.should.eql('InvalidType');
                done();
            }
        });

        it('should throw if ruleBucket is not an instance of RuleBucket', (done) => {
            try {
                RuleBucket.validate({});

                done(new Error('should have thrown'));
            } catch (err) {
                err.should.be.instanceof(StatusCodeError);
                err.statusCode.should.eql(400);
                err.items[0].applicationCode.should.eql('InvalidType');

                done();
            }
        });

        it('should throw multiple error items if multiple fields are invalid', (done) => {
            try {
                newRuleBucket.uuid = null;
                newRuleBucket.region = null;

                RuleBucket.validate(newRuleBucket);

                done(new Error('should have thrown'));
            } catch (err) {

                err.should.be.instanceOf(StatusCodeError);
                err.statusCode.should.eql(400);
                err.items.length.should.eql(2);

                err.items[0].applicationCode.should.eql('InvalidProperties');
                err.items[0].params.should.eql({uuid: null});
                err.items[0].message.should.eql('Rule.uuid: null');
                err.items[1].applicationCode.should.eql('InvalidProperties');
                err.items[1].params.should.eql({region: null});
                err.items[1].message.should.eql('Rule.region: null');

                done();
            }
        });

        const tests = [{
            target: 'uuid', tests: [
                {it: 'should not throw if uuid is undefined', value: undefined, error: false},
                {it: 'should throw if uuid is null', value: null, error: true},
                {it: 'should throw if uuid is an empty string', value: '', error: true},
                {it: 'should throw if uuid is not a valid uuid', value: 'not-a-uuid', error: true},
                {it: 'should throw if uuid is a number', value: 9, error: true},
                {it: 'should throw if uuid is an object', value: {}, error: true}
            ]
        }, {
            target: 'region', tests: [
                {it: 'should not throw if region is a string', value: 'GBR', error: false},
                {it: 'should throw if region is undefined', value: undefined, error: true},
                {it: 'should throw if region is null', value: null, error: true},
                {it: 'should throw if region is an empty string', value: '', error: true},
                {it: 'should throw if region is a number', value: 9, error: true},
                {it: 'should throw if region is an object', value: {}, error: true}
            ]
        }, {
            target: 'bankAccountId', tests: [
                {it: 'should throw if bankAccountId is undefined', value: undefined, error: true},
                {it: 'should throw if bankAccountId is null', value: null, error: true},
                {it: 'should throw if bankAccountId is an empty string', value: '', error: true},
                {it: 'should throw if bankAccountId is not a valid uuid', value: 'not-a-uuid', error: true},
                {it: 'should throw if bankAccountId is a number', value: 9, error: true},
                {it: 'should throw if bankAccountId is an object', value: {}, error: true}
            ]
        },{
            target: 'organisationId', tests: [
                {it: 'should throw if organisationId is undefined', value: undefined, error: true},
                {it: 'should throw if organisationId is null', value: null, error: true},
                {it: 'should throw if organisationId is an empty string', value: '', error: true},
                {it: 'should throw if organisationId is not a valid uuid', value: 'not-a-uuid', error: true},
                {it: 'should throw if organisationId is a number', value: 9, error: true},
                {it: 'should throw if organisationId is an object', value: {}, error: true}
            ]
        },
        {
            target: 'rules', tests: [
                {it: 'should throw if rules is undefined', value: undefined, error: false},
                {it: 'should throw if rules is null', value: null, error: true},
                {it: 'should throw if rules is an empty string', value: '', error: true},
                {it: 'should throw if rules is a string', value: 'hmmm', error: true},
                {it: 'should throw if rules is a number', value: 9, error: true},
                {it: 'should throw if rules is not a rule  object', value: {}, error: true}
            ]
        },
        {
            target: 'isAccountOwnerRules', tests: [
                {it: 'should not throw if isAccountOwnerRules is boolean', value: true, error: false},
                {it: 'should throw if isAccountOwnerRules is undefined', value: undefined, error: true},
                {it: 'should throw if isAccountOwnerRules is null', value: null, error: true},
                {it: 'should throw if isAccountOwnerRules is an empty string', value: '', error: true},
                {it: 'should throw if isAccountOwnerRules is not a valid uuid', value: 'not-a-uuid', error: true},
                {it: 'should throw if isAccountOwnerRules is a number', value: 9, error: true},
                {it: 'should throw if isAccountOwnerRules is an object', value: {}, error: true}
            ]
        }];

        const runTest = (target, tests) => {
            describe(target, () => {
                _.each(tests, (test, index) =>  {
                    it(test.it, (done) =>  {
                        try {
                            newRuleBucket[target] = test.value;
                            let result = test.error ? new Error(target + ' test ' + index + ': should have thrown') : undefined;

                            RuleBucket.validate(newRuleBucket);

                            done(result);
                        } catch (err) {
                            if (!test.error) {
                                console.log(err);
                                done((err instanceof Error) ? err : new Error());
                            } else {
                                console.log(err);
                                err.should.be.instanceOf(StatusCodeError);
                                err.statusCode.should.eql(400);
                                err.items[0].applicationCode.should.eql('InvalidProperties');
                                if (_.isArray(test.value)) {
                                    console.log('XXX Array', err.items[0].params[target]);
                                    console.log('XXX Array test val', test.value[0]);
                                } else {
                                    console.log('XXX item', err.items[0].params[target]);
                                    console.log('XXX Array test val', test.value);
                                }

                                should(err.items[0].params[target]).eql(_.isArray(test.value) ? test.value[0] : test.value);

                                done();
                            }
                        }
                    });
                });
            });
        };

        _.each(tests, (test) => {
            runTest(test.target, test.tests);
        });
    });
});
