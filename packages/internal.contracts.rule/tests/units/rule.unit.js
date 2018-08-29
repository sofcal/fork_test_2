'use strict';

const { StatusCodeError, resources } = require('../../_bankDrive');
const Rule = require('../../Rule');
const should = require('should');
const sinon = require('sinon');
const _ = require('underscore');

describe('services.ruleService', function () {
    let sandbox;
    let data;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    // rules each have targetType, and that target type determines the validation that runs on the rule. This block
    //  tests specifically the Transaction Rule validation
    describe('contract.Rule', function () {

        beforeEach(function () {
            data = {
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
            };
        });

        describe('constructor', function () {

            // if ruleAmount = 0, then entirely ignore it and use the rulePercentage instead
            // if ruleAmount > 0, then use this value and entirely ignore the rulePercentage (i.e. don’t try to validate it!)
            describe('bug 245861 - tests to support fix for splitAmount and spiltPercentage (8/8/17)', function() {
                it('should set ruleActions to empty array if undefined', function(done) {
                    try {
                        data.ruleActions = undefined;

                        let newRule = new Rule(data);

                        should.exist(newRule.ruleActions);
                        should(newRule.ruleActions).eql([]);
                        should(newRule.ruleActions).not.eql(undefined);

                        done();
                    } catch (err) {
                        done(err instanceof Error ? err : new Error(err));
                    }

                });

                it('should not have ruleActions.splitAmount if splitAmount === 0', function(done) {
                    try {
                        data.ruleActions = [{
                            splitPercentage: 50,
                            splitAmount: 0, // will be removed
                            accountantNarrative: 'New rule narrative 1',
                            accountsPostings: [{
                                type: 'customer',
                                code: 'CUST1'
                            }]
                        }];

                        let newRule = new Rule(data);

                        _.each(newRule.ruleActions, action => {
                            should.not.exist(action.splitAmount);
                            should.exist(action.splitPercentage);
                            should(action.splitPercentage).eql(50);
                        });

                        done();
                    } catch (err) {
                        done(err instanceof Error ? err : new Error(err));
                    }

                });

                it('should not have ruleActions.splitPercentage if splitAmount > 0', function(done) {
                    try {
                        data.ruleActions = [{
                            splitPercentage: 50, // will be removed
                            splitAmount: 5,
                            accountantNarrative: 'New rule narrative 1',
                            accountsPostings: [{
                                type: 'customer',
                                code: 'CUST1'
                            }]
                        }];

                        let newRule = new Rule(data);

                        _.each(newRule.ruleActions, action => {
                            should.not.exist(action.splitPercentage);
                            should.exist(action.splitAmount);
                            should(action.splitAmount).eql(5);
                        });

                        done();
                    } catch (err) {
                        done(err instanceof Error ? err : new Error(err));
                    }
                });

                it('should not have ruleActions.splitPercentage if splitAmount > 0, or should not have ruleActions.splitAmount if splitAmount === 0 ', function(done) {
                    try {
                        data.ruleActions = [{
                            splitPercentage: 50,
                            splitAmount: 0, // will be removed
                            accountantNarrative: 'New rule narrative 1',
                            accountsPostings: [{
                                type: 'customer',
                                code: 'CUST1'
                            }]
                        },
                            {
                                splitPercentage: 50, // will be removed
                                splitAmount: 5,
                                accountantNarrative: 'New rule narrative 2',
                                accountsPostings: [{
                                    type: 'customer',
                                    code: 'CUST1'
                                }]
                            }];

                        let newRule = new Rule(data);

                        should.not.exist(newRule.ruleActions[0].splitAmount);
                        should.exist(newRule.ruleActions[0].splitPercentage);
                        should(newRule.ruleActions[0].splitPercentage).eql(50);

                        should.not.exist(newRule.ruleActions[1].splitPercentage);
                        should.exist(newRule.ruleActions[1].splitAmount);
                        should(newRule.ruleActions[1].splitAmount).eql(5);

                        done();
                    } catch (err) {
                        done(err instanceof Error ? err : new Error(err));
                    }
                });

            });

            it('should create an instance of Rule using Create', function (done) {
                try {
                    var newRule = Rule.Create(data);
                    newRule.should.be.instanceof(Rule);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should assign properties using Create', function (done) {
                try {
                    data.productId = 'dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc';
                    var newRule = Rule.Create(data);
                    should(newRule.uuid).eql(data.uuid);
                    should(newRule.ruleName).eql(data.ruleName);
                    should(newRule.ruleRank).eql(data.ruleRank);
                    should(newRule.ruleConditions).eql(data.ruleConditions);
                    should(newRule.ruleActions).eql(data.ruleActions);
                    should(newRule.status).eql(data.status);
                    should(newRule.targetType).eql(data.targetType);
                    should(newRule.ruleType).eql(data.ruleType);
                    should(newRule.productId).eql(data.productId);
                    should(newRule.globalRuleId).eql(data.globalRuleId);
                    should(newRule.ruleCounts).eql(data.ruleCounts);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should create an instance of Rule', function (done) {
                try {
                    var newRule = new Rule(data);
                    newRule.should.be.instanceof(Rule);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should assign properties', function (done) {
                try {
                    data.productId = 'dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc';
                    var newRule = new Rule(data);
                    should(newRule.uuid).eql(data.uuid);
                    should(newRule.ruleName).eql(data.ruleName);
                    should(newRule.ruleRank).eql(data.ruleRank);
                    should(newRule.ruleConditions).eql(data.ruleConditions);
                    should(newRule.ruleActions).eql(data.ruleActions);
                    should(newRule.status).eql(data.status);
                    should(newRule.targetType).eql(data.targetType);
                    should(newRule.ruleType).eql(data.ruleType);
                    should(newRule.productId).eql(data.productId);
                    should(newRule.globalRuleId).eql(data.globalRuleId);
                    should(newRule.ruleCounts).eql(data.ruleCounts);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should not assign properties not on contract', function (done) {
                try {
                    data.junk = 'wahwahwah';
                    var newRule = new Rule(data);
                    should.not.exists(newRule.junk);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should assign default properties', function (done) {
                try {
                    const newRule = new Rule({});
                    should(newRule.status).eql(Rule.statuses.active);
                    should(newRule.ruleConditions).eql([]);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

        });

        describe('Rule.prototype.validate', function () {
            it('should call Rule.validate', function (done) {
                sandbox.stub(Rule, 'validate');

                try {
                    var newRule = new Rule(data);
                    Rule.validate(newRule);

                    Rule.validate.callCount.should.eql(1);
                    Rule.validate.calledWithExactly(newRule).should.eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });

        describe('Rule.validate', function () {

            let newRule;

            beforeEach(function () {
                newRule = new Rule(data);
            });

            it('should validate and throw', (done) => {
                try {
                    delete newRule.ruleName;
                    newRule.validate();

                    done(new Error('should have thrown'));
                } catch (err) {

                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should validate and not throw', (done) => {
                try {
                    delete newRule.ruleName;
                    const response = newRule.validate(true);
                    response[0].applicationCode.should.eql(resources.services.common.InvalidProperties);
                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
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
                target: 'ruleName', tests: [
                    {it: 'should not throw if ruleName is a string', value: 'rule_name', error: false},
                    {it: 'should throw if ruleName is undefined', value: undefined, error: true},
                    {it: 'should throw if ruleName is null', value: null, error: true},
                    {it: 'should throw if ruleName is an empty string', value: '', error: true},
                    {it: 'should throw if ruleName is a number', value: 9, error: true},
                    {it: 'should throw if ruleName is an object', value: {}, error: true}
                ]
            }, {
                target: 'ruleRank', tests: [
                    { it: 'should not throw if ruleRank is a positive integer', value: 1, error: false },
                    { it: 'should throw if ruleRank is a negative integer', value: -1, error: true },
                    { it: 'should throw if ruleRank is zero', value: 0, error: true },
                    { it: 'should throw if ruleRank is a decimal number', value: 1.5, error: true },
                    { it: 'should throw if ruleRank is a string', value: '1', error: true },
                    { it: 'should throw if ruleRank is an empty string', value: '', error: true },
                    { it: 'should throw if ruleRank is an object', value: {}, error: true },
                    { it: 'should not throw if ruleRank is null', value: null, error: false },
                    { it: 'should not throw if ruleRank is undefined', value: undefined, error: false }
                ]
            }, {
                target: 'status', tests: [
                    {it: 'should not throw if status is a active', value: 'active', error: false},
                    {it: 'should not throw if status is a inactive', value: 'inactive', error: false},
                    {it: 'should throw if status is a some other string', value: 'rule_name', error: true},
                    {it: 'should throw if status is undefined', value: undefined, error: true},
                    {it: 'should throw if status is null', value: null, error: true},
                    {it: 'should throw if status is an empty string', value: '', error: true},
                    {it: 'should throw if status is a number', value: 9, error: true},
                    {it: 'should throw if status is an object', value: {}, error: true}
                ]
            }, {
                target: 'targetType', tests: [
                    {it: 'should not throw if targetType is a Transaction', value: 'Transaction', error: false},
                    {it: 'should not throw if targetType is a some other string', value: 'Company', error: true},
                    {it: 'should throw if targetType is undefined', value: undefined, error: true},
                    {it: 'should throw if targetType is null', value: null, error: true},
                    {it: 'should throw if targetType is an empty string', value: '', error: true},
                    {it: 'should throw if targetType is a number', value: 9, error: true},
                    {it: 'should throw if targetType is an object', value: {}, error: true}
                ]
            }, {
                target: 'ruleConditions', tests: [
                    {
                        it: 'should not throw if ruleConditions is a valid field',
                        value: [{ruleField: 'transactionAmount', ruleOperation: 'eq', ruleCriteria: '100'}],
                        error: false
                    },
                    {
                        it: 'should not throw if ruleConditions.ruleOperation is a valid string',
                        value: [{ruleField: 'transactionAmount', ruleOperation: 'eq', ruleCriteria: '100'}],
                        error: false
                    },
                    {
                        it: 'should throw if ruleConditions is an invalid field',
                        value: [{ruleField: 'name', ruleOperation: 'eq', ruleCriteria: 'Name'}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions is an invalid string',
                        value: [{ruleField: 'badger', ruleOperation: 'eq', ruleCriteria: 'badger'}],
                        error: true
                    },
                    {it: 'should throw if ruleConditions is undefined', value: undefined, error: true},
                    {it: 'should throw if ruleConditions is null', value: null, error: true},
                    {it: 'should throw if ruleConditions is an empty object', value: {}, error: true},
                    {it: 'should throw if ruleConditions is a string', value: '', error: true},
                    {it: 'should throw if ruleConditions is a some other string', value: 'Company', error: true},
                    {it: 'should throw if ruleConditions is a number', value: 9, error: true},
                    {it: 'should throw if ruleConditions is an object', value: {}, error: true},
                    {
                        it: 'should throw if ruleConditions.ruleField is an invalid string',
                        value: [{ruleField: 'invalid', ruleOperation: '=', ruleCriteria: 'temp'}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.ruleField is undefined',
                        value: [{ruleField: undefined, ruleOperation: '=', ruleCriteria: 'temp'}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.ruleField is null',
                        value: [{ruleField: null, ruleOperation: '=', ruleCriteria: 'temp'}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.ruleField is a number',
                        value: [{ruleField: 9, ruleOperation: '=', ruleCriteria: 'temp'}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.ruleField is an object',
                        value: [{ruleField: {}, ruleOperation: '=', ruleCriteria: 'temp'}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.ruleField is an empty string',
                        value: [{ruleField: '', ruleOperation: '=', ruleCriteria: 'temp'}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.ruleOperation is an invalid string',
                        value: [{ruleField: 'transactionAmount', ruleOperation: 'invalid', ruleCriteria: 'temp'}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.ruleOperation is undefined',
                        value: [{ruleField: 'transactionAmount', ruleOperation: undefined, ruleCriteria: 'temp'}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.ruleOperation is null',
                        value: [{ruleField: 'transactionAmount', ruleOperation: null, ruleCriteria: 'temp'}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.ruleOperation is a number',
                        value: [{ruleField: 'transactionAmount', ruleOperation: 9, ruleCriteria: 'temp'}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.ruleOperation is an object',
                        value: [{ruleField: 'transactionAmount', ruleOperation: {}, ruleCriteria: 'temp'}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.ruleOperation is empty string',
                        value: [{ruleField: 'transactionAmount', ruleOperation: '', ruleCriteria: 'temp'}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.ruleCriteria is an empty',
                        value: [{ruleField: 'transactionAmount', ruleOperation: '=', ruleCriteria: ''}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.ruleCriteria is undefined',
                        value: [{ruleField: 'transactionAmount', ruleOperation: '=', ruleCriteria: undefined}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.ruleCriteria is null',
                        value: [{ruleField: 'transactionAmount', ruleOperation: '=', ruleCriteria: null}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.ruleCriteria is a number',
                        value: [{ruleField: 'transactionAmount', ruleOperation: '=', ruleCriteria: 9}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.ruleCriteria is an object',
                        value: [{ruleField: 'transactionAmount', ruleOperation: '=', ruleCriteria: {}}],
                        error: true
                    }
                ]
            }, {
                target: 'ruleActions', tests: [
                    {it: 'should throw if ruleActions is undefined', value: undefined, error: true},
                    {it: 'should throw if ruleActions is null', value: null, error: true},
                    {it: 'should throw if ruleActions is an empty object', value: {}, error: true},
                    {it: 'should throw if ruleActions is a string', value: '', error: true},
                    {it: 'should throw if ruleActions is a some other string', value: 'Company', error: true},
                    {it: 'should throw if ruleActions is a number', value: 9, error: true},
                    {it: 'should throw if ruleActions is an object', value: {}, error: true},
                    {
                        it: 'should throw if ruleActions.splitAmount is a negative number',
                        value: [{
                            splitAmount: -1,
                            accountantNarrative: 'temp',
                            accountsPostings: [{type: 'type', code: 'code'}]
                        }],
                        error: true
                    },
                    {
                        it: 'should not throw if ruleActions.splitAmount is undefined',
                        value: [{
                            splitAmount: undefined,
                            splitPercentage: 100,
                            accountantNarrative: 'temp',
                            accountsPostings: [{type: 'type', code: 'code'}]
                        }],
                        error: false
                    },
                    {
                        it: 'should not throw if ruleActions.splitAmount is null',
                        value: [{
                            splitAmount: null,
                            splitPercentage: 100,
                            accountantNarrative: 'temp',
                            accountsPostings: [{type: 'type', code: 'code'}]
                        }],
                        error: true  // removed allow null as not nullable in client library
                    },
                    {
                        it: 'should throw if ruleActions.splitAmount is a string',
                        value: [{
                            splitAmount: 'invalid',
                            accountantNarrative: 'temp',
                            accountsPostings: [{type: 'type', code: 'code'}]
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if ruleActions.splitAmount is an object',
                        value: [{
                            splitAmount: {},
                            accountantNarrative: 'temp',
                            accountsPostings: [{type: 'type', code: 'code'}]
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if ruleActions.splitPercentage is a negative number',
                        value: [{
                            splitPercentage: -1,
                            accountantNarrative: 'temp',
                            accountsPostings: [{type: 'type', code: 'code'}]
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if ruleActions.splitPercentage is a over 100',
                        value: [{
                            splitPercentage: 101,
                            accountantNarrative: 'temp',
                            accountsPostings: [{type: 'type', code: 'code'}]
                        }],
                        error: true
                    },
                    {
                        it: 'should not throw if ruleActions.splitPercentage is undefined',
                        value: [{
                            splitPercentage: undefined,
                            accountantNarrative: 'temp',
                            accountsPostings: [{type: 'type', code: 'code'}]
                        }],
                        error: false
                    },
                    {
                        it: 'should not throw if ruleActions.splitPercentage is null',
                        value: [{
                            splitAmount: 100,
                            splitPercentage: null,
                            accountantNarrative: 'temp',
                            accountsPostings: [{type: 'type', code: 'code'}]
                        }],
                        error: true  // removed allow null as not nullable in client library
                    },
                    {
                        it: 'should throw if ruleActions.splitPercentage is a string',
                        value: [{
                            splitAmount: 100,
                            splitPercentage: 'invalid',
                            accountantNarrative: 'temp',
                            accountsPostings: [{type: 'type', code: 'code'}]
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if ruleActions.splitPercentage is an object',
                        value: [{
                            splitPercentage: {},
                            accountantNarrative: 'temp',
                            accountsPostings: [{type: 'type', code: 'code'}]
                        }],
                        error: true
                    },
                    {
                        it: 'should not throw if ruleConditions.accountantNarrative is an empty string',
                        value: [{
                            splitPercentage: 100,
                            accountantNarrative: '',
                            accountsPostings: [{type: 'type', code: 'code'}]
                        }],
                        error: false
                    },
                    {
                        it: 'should not throw if ruleConditions.accountantNarrative is undefined',
                        value: [{
                            splitPercentage: 100,
                            accountantNarrative: undefined,
                            accountsPostings: [{type: 'type', code: 'code'}]
                        }],
                        error: false
                    },
                    {
                        it: 'should not throw if ruleConditions.accountantNarrative is null',
                        value: [{
                            splitPercentage: 100,
                            accountantNarrative: null,
                            accountsPostings: [{type: 'type', code: 'code'}]
                        }],
                        error: false
                    },
                    {
                        it: 'should throw if ruleConditions.accountantNarrative is a number',
                        value: [{
                            splitPercentage: 100,
                            accountantNarrative: 0,
                            accountsPostings: [{type: 'type', code: 'code'}]
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.accountantNarrative is an object',
                        value: [{
                            splitPercentage: 100,
                            accountantNarrative: {},
                            accountsPostings: [{type: 'type', code: 'code'}]
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.accountsPostings is an empty string',
                        value: [{splitPercentage: 100, accountantNarrative: 'narrative', accountsPostings: ''}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.accountsPostings is undefined',
                        value: [{splitPercentage: 100, accountantNarrative: 'narrative', accountsPostings: undefined}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.accountsPostings is null',
                        value: [{splitPercentage: 100, accountantNarrative: 'narrative', accountsPostings: null}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.accountsPostings is a number',
                        value: [{splitPercentage: 100, accountantNarrative: 'narrative', accountsPostings: 9}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.accountsPostings is an object',
                        value: [{splitPercentage: 100, accountantNarrative: 'narrative', accountsPostings: {}}],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.accountsPostings.type is an empty string',
                        value: [{
                            splitPercentage: 100,
                            accountantNarrative: 'narrative',
                            accountsPostings: [{type: '', code: 'code'}]
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.accountsPostings.type is undefined',
                        value: [{
                            splitPercentage: 100,
                            accountantNarrative: 'narrative',
                            accountsPostings: [{type: undefined, code: 'code'}]
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.accountsPostings.type is null',
                        value: [{
                            splitPercentage: 100,
                            accountantNarrative: 'narrative',
                            accountsPostings: [{type: null, code: 'code'}]
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.accountsPostings.type is a number',
                        value: [{
                            splitPercentage: 100,
                            accountantNarrative: 'narrative',
                            accountsPostings: [{type: 9, code: 'code'}]
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.accountsPostings.type is an object',
                        value: [{
                            splitPercentage: 100,
                            accountantNarrative: 'narrative',
                            accountsPostings: [{type: {}, code: 'code'}]
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.accountsPostings.code is an empty string',
                        value: [{
                            splitPercentage: 100,
                            accountantNarrative: 'narrative',
                            accountsPostings: [{type: 'type', code: ''}]
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.accountsPostings.code is undefined',
                        value: [{
                            splitPercentage: 100,
                            accountantNarrative: 'narrative',
                            accountsPostings: [{type: 'type', code: undefined}]
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.accountsPostings.code is null',
                        value: [{
                            splitPercentage: 100,
                            accountantNarrative: 'narrative',
                            accountsPostings: [{type: 'type', code: null}]
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.accountsPostings.code is a number',
                        value: [{
                            splitPercentage: 100,
                            accountantNarrative: 'narrative',
                            accountsPostings: [{type: 'type', code: 0}]
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if ruleConditions.accountsPostings.code is an object',
                        value: [{
                            splitPercentage: 100,
                            accountantNarrative: 'narrative',
                            accountsPostings: [{type: 'type', code: {}}]
                        }],
                        error: true
                    }
                ]
            }, {
                target: 'counts', tests: [
                    {
                        it: 'should not throw if counts.applied is a number ',
                        value: [{ruleField: 'applied', ruleOperation: 'eq', ruleCriteria: 100}],
                        error: false
                    },
                    {
                        it: 'should not throw if counts.fail is a number',
                        value: [{ruleField: 'fail', ruleOperation: 'eq', ruleCriteria: 100}],
                        error: false
                    },
                    {
                        it: 'should not throw if counts.applied is a number',
                        value: [{ruleField: 'applied', ruleOperation: 'eq', ruleCriteria: 100}],
                        error: false
                    },
                    {
                        it: 'should throw if counts.applied is a string ',
                        value: [{ruleField: 'applied', ruleOperation: 'eq', ruleCriteria: 'a'}],
                        error: false
                    },
                    {
                        it: 'should throw if counts.fail is a string',
                        value: [{ruleField: 'fail', ruleOperation: 'eq', ruleCriteria: 'a'}],
                        error: false
                    },
                    {
                        it: 'should throw if counts.applied is a number',
                        value: [{ruleField: 'applied', ruleOperation: 'eq', ruleCriteria: 'a'}],
                        error: false
                    }
                ]
            }];

            var runTest = function (target, tests) {
                describe(target, function () {
                    _.each(tests, function (test, index) {
                        it(test.it, function (done) {
                            try {
                                newRule[target] = test.value;
                                var result = test.error ? new Error(target + ' test ' + index + ': should have thrown') : undefined;

                                Rule.validate(newRule);

                                done(result);
                            } catch (err) {
                                if (!test.error) {
                                    console.log(err);
                                    done((err instanceof Error) ? err : new Error());
                                } else {
                                    console.log(err);
                                    err.should.be.instanceOf(StatusCodeError);
                                    err.statusCode.should.eql(400);
                                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);
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
                        })
                    })
                })
            };

            _.each(tests, function (test) {
                runTest(test.target, test.tests);
            });

            it('should not throw for valid data', function (done) {
                try {
                    Rule.validate(newRule);
                    done();
                } catch (err) {
                    console.log(err);
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw if rule is undefined', function (done) {
                try {
                    Rule.validate(undefined);

                    done(new Error('should have thrown'));
                } catch (err) {

                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidType);

                    done();
                }
            });

            it('should throw if rule is null', function (done) {
                try {
                    Rule.validate(null);

                    done(new Error('should have thrown'));
                } catch (err) {

                    err.should.be.instanceof(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidType);

                    done();
                }
            });

            it('should throw if rule is not an instance of Rule', function (done) {
                try {
                    Rule.validate({});

                    done(new Error('should have thrown'));
                } catch (err) {

                    err.should.be.instanceof(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidType);

                    done();
                }
            });

            it('should throw multiple error items if multiple fields are invalid', function (done) {
                try {
                    newRule.uuid = null;
                    newRule.ruleName = null;

                    Rule.validate(newRule);

                    done(new Error('should have thrown'));
                } catch (err) {

                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items.length.should.eql(2);

                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);
                    err.items[0].params.should.eql({uuid: null});
                    err.items[0].message.should.eql('Rule.uuid: null');
                    err.items[1].applicationCode.should.eql(resources.services.common.InvalidProperties);
                    err.items[1].params.should.eql({ruleName: null});
                    err.items[1].message.should.eql('Rule.ruleName: null');

                    done();
                }
            });

            it('should not throw on validation if noThrow is specified', function (done) {
                try {
                    newRule.uuid = null;
                    newRule.ruleName = null;

                    var items = Rule.validate(newRule, true);

                    should(items).be.an.Array().of.length(2);
                    should(items[0].applicationCode).eql(resources.services.common.InvalidProperties);
                    should(items[0].params).eql({uuid: null});
                    should(items[1].applicationCode).eql(resources.services.common.InvalidProperties);
                    should(items[1].params).eql({ruleName: null});

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            })
        });

        describe('Rule.filter', function () {
            var newRule;

            beforeEach(function () {
                newRule = new Rule(data);
            });

            it('should filter out secret & irrelevant info', function (done) {
                var filteredRule = Rule.filter(newRule);

                should.not.exists(filteredRule.created);
                should.not.exists(filteredRule.updated);
                should.not.exists(filteredRule.etag);

                should.exists(filteredRule.uuid);
                should.exists(filteredRule.ruleName);
                should.exists(filteredRule.ruleConditions);
                should.exists(filteredRule.ruleActions);

                done();
            });
        });

        describe('Rule.extend', function () {

            var oldRule;

            beforeEach(function () {
                data.productId = 'dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc';
                oldRule = new Rule(data);
            });

            it('should filter out properties that do not belong to rule', function (done) {
                try {
                    var test = JSON.parse(JSON.stringify(oldRule));
                    test.ruleName = 'modified_name';
                    test.additional1 = 'should_be_stripped';
                    test.ruleName2 = 'should_be_stripped';
                    test.ruleNamee = 'should_be_stripped';

                    var extended = Rule.extend(oldRule, test, 'post');

                    should(extended).eql({
                        uuid: '2a867f21-cf12-48f2-914f-5a741e719b27',
                        ruleName: 'modified_name',
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
                        targetType: 'Transaction',
                        ruleType: 'User',
                        status: 'active',
                        productId: 'dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc',
                        globalRuleId: undefined,
                    });

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should remove non-readonly properties from the old rule if using put', function (done) {
                try {
                    var test = {
                        ruleName: 'modified_name',
                        additional1: 'should_be_stripped',
                        ruleName2: 'should_be_stripped',
                        ruleNamee: 'should_be_stripped'
                    };

                    var extended = Rule.extend(oldRule, test, 'put');

                    should(extended).eql({
                        uuid: '2a867f21-cf12-48f2-914f-5a741e719b27',
                        ruleName: 'modified_name',
                        ruleType: 'User',
                        targetType: 'Transaction',
                        productId: 'dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc',
                        globalRuleId: undefined,
                    });

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should not modify the old rule', function (done) {
                try {
                    var test = {
                        ruleName: 'modified_name',
                        additional1: 'should_be_stripped',
                        ruleName2: 'should_be_stripped',
                        ruleNamee: 'should_be_stripped'
                    };

                    Rule.extend(oldRule, test, 'put');
                    should(oldRule.uuid).eql(data.uuid);
                    should(oldRule.ruleName).eql(data.ruleName);
                    should(oldRule.ruleRank).eql(data.ruleRank);
                    should(oldRule.ruleConditions).eql(data.ruleConditions);
                    should(oldRule.ruleActions).eql(data.ruleActions);
                    should(oldRule.status).eql(data.status);
                    should(oldRule.targetType).eql(data.targetType);
                    should(oldRule.ruleType).eql(data.ruleType);
                    should(oldRule.productId).eql(data.productId);
                    should(oldRule.globalRuleId).eql(data.globalRuleId);
                    should(oldRule.ruleCounts).eql(data.ruleCounts);
                    should(oldRule.additional1).eql(undefined);
                    should(oldRule.ruleName2).eql(undefined);
                    should(oldRule.ruleNamee).eql(undefined);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });

        describe('Rule sort', () => {

            it('should sort rules based on rank', (done) => {
                const rule1 = new Rule(data);
                rule1.ruleType = Rule.ruleTypes.global;
                rule1.ruleRank = 3;
                const rule2 = new Rule(data);
                rule2.ruleType = Rule.ruleTypes.feedback;
                rule2.ruleRank = 2;
                const rule3 = new Rule(data);
                rule3.ruleType = Rule.ruleTypes.user;
                rule3.ruleRank = 1;
                const rules = [
                    rule1, rule2, rule3
                ];
                const orderedRules = Rule.sortRulesByRank(rules);
                should(orderedRules[0].ruleType).eql(Rule.ruleTypes.user);
                should(orderedRules[1].ruleType).eql(Rule.ruleTypes.feedback);
                should(orderedRules[2].ruleType).eql(Rule.ruleTypes.global);
                done();
            });
        });

        describe('GetRuleTypesToProcess', () => {

            it('should return user and accountant if bankaccount.featureOptions.autoCreateRules is false', (done) => {
                const bankAccount = { featureOptions: { autoCreateRules: false } };
                const types = Rule.GetRuleTypesToProcess(bankAccount);
                types.should.eql([Rule.ruleTypes.user, Rule.ruleTypes.accountant]);
                done();
            });

            it('should return user, accountant, feedback and global if bankaccount.featureOptions.autoCreateRules is true', (done) => {
                const bankAccount = { featureOptions: { autoCreateRules: true } };
                const types = Rule.GetRuleTypesToProcess(bankAccount);
                types.should.eql([Rule.ruleTypes.user, Rule.ruleTypes.accountant, Rule.ruleTypes.feedback, Rule.ruleTypes.global]);
                done();
            })

        })
    })
});