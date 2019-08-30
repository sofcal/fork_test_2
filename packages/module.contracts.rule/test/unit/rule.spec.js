'use strict';

const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-statuscodeerror');
const Rule = require('../../lib/Rule');
const should = require('should');
const sinon = require('sinon');
const _ = require('underscore');

describe('@sage/bc-contracts-rule.Rule', function () {
    let sandbox;
    let data;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        sandbox.restore();
    });

    // rules each have a targetType, and that target type determines the validation that runs on the rule. This block
    //  tests specifically the Transaction Rule validation
    describe('contract.Rule', () => {
        beforeEach(() => {
            data = {
                uuid: '2a867f21-cf12-48f2-914f-5a741e719b27',
                productId: 'dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc',
                globalRuleId: null,
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
                    success: 3,
                    fail: 1,
                    applied: 2
                },
                ruleAdditionalFields: [{
                    name: 'auto-post',
                    value: 'true'
                }],
                targetType: 'Transaction',
                ruleType: 'User',
                status: 'active'
            };
        });

        describe('constructor', () => {
            it('should create an instance of Rule', () => {
                const uut = new Rule(data);
                should(uut).be.instanceof(Rule);
            });

            it('should ensure the contract is not modified without tests breaking', () => {
                const expected = [
                    'uuid', 'productId', 'globalRuleId', 'ruleName', 'ruleRank', 'targetType', 'ruleType', 'status',
                    'ruleConditions', 'ruleActions', 'ruleAdditionalFields', 'ruleCounts'
                ];
                should(Object.keys(new Rule({}))).eql(expected);
            });

            it('should assign properties', () => {
                const uut = new Rule(data);

                should(uut.uuid).eql('2a867f21-cf12-48f2-914f-5a741e719b27');
                should(uut.productId).eql('dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc');
                should(uut.globalRuleId).eql(null);
                should(uut.ruleName).eql('New rule');
                should(uut.ruleRank).eql(1);
                should(uut.targetType).eql('Transaction');
                should(uut.ruleType).eql('User');
                should(uut.status).eql('active');

                should(uut.ruleConditions).be.an.Array().of.length(1);
                    should(uut.ruleConditions[0].ruleField).eql('transactionAmount');
                    should(uut.ruleConditions[0].ruleOperation).eql('gt');
                    should(uut.ruleConditions[0].ruleCriteria).eql('10');

                should(uut.ruleActions).be.an.Array().of.length(1);
                    should(uut.ruleActions[0].splitPercentage).eql(100);
                    should(uut.ruleActions[0].accountantNarrative).eql('New rule narrative');

                    should(uut.ruleActions[0].accountsPostings).be.an.Array().of.length(1);
                        should(uut.ruleActions[0].accountsPostings[0].type).eql('customer');
                        should(uut.ruleActions[0].accountsPostings[0].code).eql('CUST1');

                should(uut.ruleCounts).be.an.Object();
                    should(uut.ruleCounts.applied).eql(2);
                    should(uut.ruleCounts.fail).eql(1);
                    should(uut.ruleCounts.success).eql(3);

                should(uut.ruleAdditionalFields).be.an.Array().of.length(1);
                    should(uut.ruleAdditionalFields[0].name).eql('auto-post');
                    should(uut.ruleAdditionalFields[0].value).eql('true');
            });

            it('should assign default properties', () => {
                const uut = new Rule({});

                should(uut.uuid).eql(undefined);
                should(uut.productId).eql(undefined);
                should(uut.globalRuleId).eql(null);
                should(uut.ruleName).eql(undefined);
                should(uut.ruleRank).eql(null);
                should(uut.targetType).eql(undefined);
                should(uut.ruleType).eql(undefined);
                should(uut.status).eql('active');

                should(uut.ruleConditions).be.an.Array().of.length(0);

                // bug 245861 - should set ruleActions to an empty array
                should(uut.ruleActions).be.an.Array().of.length(0);

                should(uut.ruleCounts).be.an.Object();
                should(uut.ruleCounts.applied).eql(0);
                should(uut.ruleCounts.fail).eql(1);
                should(uut.ruleCounts.success).eql(0);

                should(uut.ruleAdditionalFields).be.an.Array().of.length(0);
            });


            it('should not assign properties not on contract', () => {
                data.junk = 'wahwahwah';
                const uut = new Rule(data);
                should.not.exists(uut.junk);
            });

            describe('defaulting splitAmount and splitPercentage', () => {
                // if ruleAmount = 0, then entirely ignore it and use the rulePercentage instead
                // if ruleAmount > 0, then use this value and entirely ignore the rulePercentage (i.e. don’t try to validate it!)

                it('should remove ruleActions.splitAmount if splitAmount === 0', () => {
                    data.ruleActions = [{
                        splitPercentage: 50,
                        splitAmount: 0, // should be removed
                        accountantNarrative: 'New rule narrative 1',
                        accountsPostings: [{
                            type: 'customer',
                            code: 'CUST1'
                        }]
                    }];

                    const uut = new Rule(data);

                    should(uut.ruleActions).be.an.Array().of.length(1);
                    should(uut.ruleActions[0].splitPercentage).eql(50);
                    should.not.exist(uut.ruleActions[0].splitAmount);
                });

                it('should remove ruleActions.splitPercentage if splitAmount > 0', () => {
                    data.ruleActions = [{
                        splitPercentage: 50, // will be removed
                        splitAmount: 5,
                        accountantNarrative: 'New rule narrative 1',
                        accountsPostings: [{
                            type: 'customer',
                            code: 'CUST1'
                        }]
                    }];

                    const uut = new Rule(data);

                    should(uut.ruleActions).be.an.Array().of.length(1);
                    should.not.exist(uut.ruleActions[0].splitPercentage);
                    should(uut.ruleActions[0].splitAmount).eql(5);
                });

                it('should apply this logic over multiple ruleActions', () => {
                    data.ruleActions = [{
                        splitPercentage: 50, // will be removed
                        splitAmount: 5,
                        accountantNarrative: 'New rule narrative 2',
                        accountsPostings: [{
                            type: 'customer',
                            code: 'CUST1'
                        }]
                    }, {
                        splitPercentage: 50,
                        splitAmount: 0, // will be removed
                        accountantNarrative: 'New rule narrative 1',
                        accountsPostings: [{
                            type: 'customer',
                            code: 'CUST1'
                        }]
                    }];

                    const uut = new Rule(data);

                    should(uut.ruleActions).be.an.Array().of.length(2);

                    should.not.exist(uut.ruleActions[0].splitPercentage);
                    should(uut.ruleActions[0].splitAmount).eql(5);

                    should(uut.ruleActions[1].splitPercentage).eql(50);
                    should.not.exist(uut.ruleActions[1].splitAmount);
                });
            });
        });

        describe('Rule.prototype.validate', () => {
            it('should call Rule.validate', () => {
                sandbox.stub(Rule, 'validate');

                const uut = new Rule(data);
                uut.validate();

                should(Rule.validate.callCount).eql(1);
                should(Rule.validate.calledWithExactly(uut, false)).eql(true);
            });

            it('should call Rule.validate with noThrow', () => {
                sandbox.stub(Rule, 'validate');

                const uut = new Rule(data);
                uut.validate(true);

                should(Rule.validate.callCount).eql(1);
                should(Rule.validate.calledWithExactly(uut, true)).eql(true);
            });
        });

        describe('Rule.validate', function () {
            let uut;

            const str1Char = 'x';
            const str50Char = str1Char.repeat(50);
            const str51Char = str1Char.repeat(51);

            beforeEach(function () {
                uut = new Rule(data);
            });

            const substitute = (obj, prop, value) => {
                const splits = prop.split('.');

                let ref = obj;
                _.times(splits.length, (i) => {
                    let key = splits[i];
                    let match = key.match(/\[(\d*)\]/);
                    if (i < splits.length - 1) {
                        ref = match ? ref[key.substring(0, match['index'])][match[1]] : ref[key];
                    } else {
                        (match ? (ref[key.substring(0, match['index'])][match[1]] = value) : ref[key] = value);
                    }
                });

                return obj;
            };

            const shouldT = (func) => {
                return {
                    throw: (expected) => {
                        let err = null;
                        try {
                            func();
                            err = new Error('should have thrown');
                        } catch(e1) {
                            should(e1).eql(expected);
                        }

                        if (err) { throw err; }
                    },
                    not: {
                        throw: () => {
                            func();
                        }
                    }
                }
            };

            it('should return an empty array if valid and noThrow=true', () => {
                should(Rule.validate(uut, true)).eql([]);
            });

            it('should return undefined if valid and noThrow=false', () => {
                should(Rule.validate(uut, false)).eql(undefined);
            });

            describe('uuid', () => {
                it('should NOT throw if uuid valid', () => {
                    should(() => Rule.validate(substitute(uut, 'uuid', '00000000-0000-0000-0000-000000000000'))).not.throw();
                    should(() => Rule.validate(substitute(uut, 'uuid', undefined))).not.throw();
                });

                it('should throw if uuid invalid', () => {
                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.uuid: ${value}`, { uuid: value })], 400));
                    should(() => Rule.validate(substitute(uut, 'uuid', null))).throw(expected(null));
                    should(() => Rule.validate(substitute(uut, 'uuid', ''))).throw(expected(''));
                    should(() => Rule.validate(substitute(uut, 'uuid', 'not-a-uuid'))).throw(expected('not-a-uuid'));
                    should(() => Rule.validate(substitute(uut, 'uuid', 9))).throw(expected(9));
                    should(() => Rule.validate(substitute(uut, 'uuid', {}))).throw(expected({}));
                });
            });

            describe('ruleName', () => {
                it('should NOT throw when valid', () => {
                    should(() => Rule.validate(substitute(uut, 'ruleName', 'valid string name'))).not.throw();
                });

                it('should throw when invalid', () => {
                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.ruleName: ${value}`, { ruleName: value })], 400));
                    should(() => Rule.validate(substitute(uut, 'ruleName', undefined))).throw(expected(undefined));
                    should(() => Rule.validate(substitute(uut, 'ruleName', null))).throw(expected(null));
                    should(() => Rule.validate(substitute(uut, 'ruleName', ''))).throw(expected(''));
                    should(() => Rule.validate(substitute(uut, 'ruleName', 9))).throw(expected(9));
                    should(() => Rule.validate(substitute(uut, 'ruleName', {}))).throw(expected({}));
                });
            });

            describe('ruleRank', () => {
                it('should NOT throw when valid', (done) => {
                    try {
                        shouldT(() => Rule.validate(substitute(uut, 'ruleRank', 1))).not.throw();
                        shouldT(() => Rule.validate(substitute(uut, 'ruleRank', undefined))).not.throw();
                        shouldT(() => Rule.validate(substitute(uut, 'ruleRank', null))).not.throw();

                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                it('should throw when invalid', (done) => {
                    try {
                        const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.ruleRank: ${value}`, { ruleRank: value })], 400));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleRank', -9))).throw(expected(-9));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleRank', 0))).throw(expected(0));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleRank', 1.5))).throw(expected(1.5));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleRank', '9'))).throw(expected('9'));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleRank', ''))).throw(expected(''));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleRank', {}))).throw(expected({}));

                        done();
                    } catch(err) {
                        done(err);
                    }
                });
            });

            describe('status', () => {
                it('should NOT throw when valid', (done) => {
                    try {
                        shouldT(() => Rule.validate(substitute(uut, 'status', 'active'))).not.throw();
                        shouldT(() => Rule.validate(substitute(uut, 'status', 'inactive'))).not.throw();

                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                it('should throw when invalid', (done) => {
                    try {
                        const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.status: ${value}`, { status: value })], 400));
                        shouldT(() => Rule.validate(substitute(uut, 'status', undefined))).throw(expected(undefined));
                        shouldT(() => Rule.validate(substitute(uut, 'status', null))).throw(expected(null));
                        shouldT(() => Rule.validate(substitute(uut, 'status', 'some_string'))).throw(expected('some_string'));
                        shouldT(() => Rule.validate(substitute(uut, 'status', ''))).throw(expected(''));
                        shouldT(() => Rule.validate(substitute(uut, 'status', 9))).throw(expected(9));
                        shouldT(() => Rule.validate(substitute(uut, 'status', {}))).throw(expected({}));

                        done();
                    } catch(err) {
                        done(err);
                    }
                });
            });

            describe('targetType', () => {
                it('should NOT throw when valid', (done) => {
                    try {
                        shouldT(() => Rule.validate(substitute(uut, 'targetType', 'Transaction'))).not.throw();

                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                it('should throw when invalid', (done) => {
                    try {
                        const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.targetType: ${value}`, { targetType: value })], 400));
                        shouldT(() => Rule.validate(substitute(uut, 'targetType', undefined))).throw(expected(undefined));
                        shouldT(() => Rule.validate(substitute(uut, 'targetType', null))).throw(expected(null));
                        shouldT(() => Rule.validate(substitute(uut, 'targetType', 'Company'))).throw(expected('Company'));
                        shouldT(() => Rule.validate(substitute(uut, 'targetType', ''))).throw(expected(''));
                        shouldT(() => Rule.validate(substitute(uut, 'targetType', 9))).throw(expected(9));
                        shouldT(() => Rule.validate(substitute(uut, 'targetType', {}))).throw(expected({}));

                        done();
                    } catch(err) {
                        done(err);
                    }
                });
            });

            describe('ruleConditions', () => {
                it('should NOT throw when valid', (done) => {
                    try {
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'transactionNarrative', ruleOperation: 'eq', ruleCriteria: 'equals_field'}]))).not.throw();

                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                it('should throw when invalid', (done) => {
                    try {
                        const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.ruleConditions: should be an array`, { ruleConditions: value })], 400));

                        // checks for when the entire ruleConditions object is invalid
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', null))).throw(expected(null));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', 'some_string'))).throw(expected('some_string'));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', ''))).throw(expected(''));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', 9))).throw(expected(9));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', {}))).throw(expected({}));

                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                describe('ruleField', () => {
                    it('should throw when invalid', (done) => {
                        try {
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.ruleConditions: ${JSON.stringify(value)}`, { ruleConditions: value })], 400));

                            shouldT(() => Rule.validate(substitute(uut, 'ruleConditions[0].ruleField', undefined))).throw(expected({ruleField: undefined, ruleOperation: 'gt', ruleCriteria: '10'}));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleConditions[0].ruleField', null))).throw(expected({ruleField: null, ruleOperation: 'gt', ruleCriteria: '10'}));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleConditions[0].ruleField', ''))).throw(expected({ruleField: '', ruleOperation: 'gt', ruleCriteria: '10'}));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleConditions[0].ruleField', 9))).throw(expected({ruleField: 9, ruleOperation: 'gt', ruleCriteria: '10'}));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleConditions[0].ruleField', {}))).throw(expected({ruleField: {}, ruleOperation: 'gt', ruleCriteria: '10'}));

                            done();
                        } catch(err) {
                            done(err);
                        }
                    });
                });

                describe('ruleOperation', () => {
                    it('should throw when invalid', (done) => {
                        try {
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.ruleConditions: ${JSON.stringify(value)}`, { ruleConditions: value })], 400));

                            const ruleOperation = {ruleField: 'transactionAmount', ruleOperation: 'eq', ruleCriteria: 'equals_field'};
                            shouldT(() => Rule.validate(substitute(uut, 'ruleConditions[0].ruleOperation', undefined))).throw(expected({ruleField: 'transactionAmount', ruleOperation: undefined, ruleCriteria: '10'}));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleConditions[0].ruleOperation', null))).throw(expected({ruleField: 'transactionAmount', ruleOperation: null, ruleCriteria: '10'}));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleConditions[0].ruleOperation', ''))).throw(expected({ruleField: 'transactionAmount', ruleOperation: '', ruleCriteria: '10'}));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleConditions[0].ruleOperation', 9))).throw(expected({ruleField: 'transactionAmount', ruleOperation: 9, ruleCriteria: '10'}));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleConditions[0].ruleOperation', {}))).throw(expected({ruleField: 'transactionAmount', ruleOperation: {}, ruleCriteria: '10'}));

                            done();
                        } catch(err) {
                            done(err);
                        }
                    });
                });

                describe('ruleCriteria', () => {
                    it('should throw when invalid', (done) => {
                        try {
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.ruleConditions: ${JSON.stringify(value)}`, { ruleConditions: value })], 400));

                            const ruleCriteria = {ruleField: 'transactionAmount', ruleOperation: 'eq', ruleCriteria: 'equals_field'};
                            shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(ruleCriteria, 'ruleCriteria', undefined)]))).throw(expected(substitute(ruleCriteria, 'ruleCriteria', undefined)));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(ruleCriteria, 'ruleCriteria', null)]))).throw(expected(substitute(ruleCriteria, 'ruleCriteria', null)));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(ruleCriteria, 'ruleCriteria', '')]))).throw(expected(substitute(ruleCriteria, 'ruleCriteria', '')));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(ruleCriteria, 'ruleCriteria', 9)]))).throw(expected(substitute(ruleCriteria, 'ruleCriteria', 9)));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(ruleCriteria, 'ruleCriteria', {})]))).throw(expected(substitute(ruleCriteria, 'ruleCriteria', {})));

                            done();
                        } catch(err) {
                            done(err);
                        }
                    });
                });
            });

            describe('Transaction', () => {
                it('should NOT throw if ruleConditions is valid', (done) => {
                    try {
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'transactionNarrative', ruleOperation: 'eq', ruleCriteria: 'equals_field'}]))).not.throw();
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'transactionNarrative', ruleOperation: 'contains', ruleCriteria: 'contains_field'}]))).not.throw();
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'transactionNarrative', ruleOperation: 'notcontains', ruleCriteria: 'does_not_contain_field'}]))).not.throw();
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'transactionNarrative', ruleOperation: 'containsWords', ruleCriteria: 'contains_words_field'}]))).not.throw();

                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'transactionAmount', ruleOperation: 'eq', ruleCriteria: '100'}]))).not.throw();
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'transactionAmount', ruleOperation: 'gt', ruleCriteria: '100'}]))).not.throw();
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'transactionAmount', ruleOperation: 'lt', ruleCriteria: '100'}]))).not.throw();
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'transactionAmount', ruleOperation: 'ge', ruleCriteria: '100'}]))).not.throw();
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'transactionAmount', ruleOperation: 'le', ruleCriteria: '100'}]))).not.throw();

                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'datePosted', ruleOperation: 'gt', ruleCriteria: '2019-08-01'}]))).not.throw();
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'datePosted', ruleOperation: 'lt', ruleCriteria: '2019-08-01'}]))).not.throw();
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'datePosted', ruleOperation: 'ge', ruleCriteria: '2019-08-01'}]))).not.throw();
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'datePosted', ruleOperation: 'le', ruleCriteria: '2019-08-01'}]))).not.throw();

                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'transactionType', ruleOperation: 'eq', ruleCriteria: 'credit'}]))).not.throw();

                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'checkNum', ruleOperation: 'eq', ruleCriteria: '101'}]))).not.throw();

                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [{ruleField: 'currency', ruleOperation: 'eq', ruleCriteria: 'GBP'}]))).not.throw();

                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                it('should throw if ruleConditions invalid', (done) => {
                    try {
                        const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.ruleConditions: ${JSON.stringify(value)}`, { ruleConditions: value })], 400));

                        const narrative = {ruleField: 'transactionNarrative', ruleOperation: 'eq', ruleCriteria: 'equals_field'};
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(narrative, 'ruleOperation', 'gt')]))).throw(expected(substitute(narrative, 'ruleOperation', 'gt')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(narrative, 'ruleOperation', 'lt')]))).throw(expected(substitute(narrative, 'ruleOperation', 'lt')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(narrative, 'ruleOperation', 'ge')]))).throw(expected(substitute(narrative, 'ruleOperation', 'ge')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(narrative, 'ruleOperation', 'le')]))).throw(expected(substitute(narrative, 'ruleOperation', 'le')));

                        const amount = {ruleField: 'transactionAmount', ruleOperation: 'contains', ruleCriteria: 101 };
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(amount, 'ruleOperation', 'contains')]))).throw(expected(substitute(amount, 'ruleOperation', 'contains')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(amount, 'ruleOperation', 'notcontains')]))).throw(expected(substitute(amount, 'ruleOperation', 'notcontains')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(amount, 'ruleOperation', 'containsWords')]))).throw(expected(substitute(amount, 'ruleOperation', 'containsWords')));

                        const datePosted = {ruleField: 'datePosted', ruleOperation: 'contains', ruleCriteria: '2019-08-01' };
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(datePosted, 'ruleOperation', 'contains')]))).throw(expected(substitute(datePosted, 'ruleOperation', 'contains')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(datePosted, 'ruleOperation', 'notcontains')]))).throw(expected(substitute(datePosted, 'ruleOperation', 'notcontains')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(datePosted, 'ruleOperation', 'containsWords')]))).throw(expected(substitute(datePosted, 'ruleOperation', 'containsWords')));

                        const transactionType = {ruleField: 'transactionType', ruleOperation: 'contains', ruleCriteria: 'credit_card' };
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(transactionType, 'transactionType', 'contains')]))).throw(expected(substitute(transactionType, 'transactionType', 'contains')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(transactionType, 'transactionType', 'notcontains')]))).throw(expected(substitute(transactionType, 'transactionType', 'notcontains')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(transactionType, 'transactionType', 'containsWords')]))).throw(expected(substitute(transactionType, 'transactionType', 'containsWords')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(transactionType, 'transactionType', 'gt')]))).throw(expected(substitute(transactionType, 'transactionType', 'gt')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(transactionType, 'transactionType', 'ge')]))).throw(expected(substitute(transactionType, 'transactionType', 'ge')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(transactionType, 'transactionType', 'lt')]))).throw(expected(substitute(transactionType, 'transactionType', 'lt')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(transactionType, 'transactionType', 'le')]))).throw(expected(substitute(transactionType, 'transactionType', 'le')));

                        const checkNum = {ruleField: 'checkNum', ruleOperation: 'contains', ruleCriteria: 'check_num' };
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(checkNum, 'checkNum', 'contains')]))).throw(expected(substitute(checkNum, 'checkNum', 'contains')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(checkNum, 'checkNum', 'notcontains')]))).throw(expected(substitute(checkNum, 'checkNum', 'notcontains')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(checkNum, 'checkNum', 'containsWords')]))).throw(expected(substitute(checkNum, 'checkNum', 'containsWords')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(checkNum, 'checkNum', 'gt')]))).throw(expected(substitute(checkNum, 'checkNum', 'gt')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(checkNum, 'checkNum', 'ge')]))).throw(expected(substitute(checkNum, 'checkNum', 'ge')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(checkNum, 'checkNum', 'lt')]))).throw(expected(substitute(checkNum, 'checkNum', 'lt')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(checkNum, 'checkNum', 'le')]))).throw(expected(substitute(checkNum, 'checkNum', 'le')));

                        const currency = {ruleField: 'currency', ruleOperation: 'contains', ruleCriteria: 'GBP' };
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(currency, 'ruleOperation', 'contains')]))).throw(expected(substitute(currency, 'ruleOperation', 'contains')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(currency, 'ruleOperation', 'notcontains')]))).throw(expected(substitute(currency, 'ruleOperation', 'notcontains')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(currency, 'ruleOperation', 'containsWords')]))).throw(expected(substitute(currency, 'ruleOperation', 'containsWords')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(currency, 'ruleOperation', 'gt')]))).throw(expected(substitute(currency, 'ruleOperation', 'gt')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(currency, 'ruleOperation', 'ge')]))).throw(expected(substitute(currency, 'ruleOperation', 'ge')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(currency, 'ruleOperation', 'lt')]))).throw(expected(substitute(currency, 'ruleOperation', 'lt')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(currency, 'ruleOperation', 'le')]))).throw(expected(substitute(currency, 'ruleOperation', 'le')));

                        const payeeBankId = {ruleField: 'payee.payeeBankId', ruleOperation: 'contains', ruleCriteria: 'bank_id' };
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(payeeBankId, 'ruleOperation', 'contains')]))).throw(expected(substitute(payeeBankId, 'ruleOperation', 'contains')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(payeeBankId, 'ruleOperation', 'notcontains')]))).throw(expected(substitute(payeeBankId, 'ruleOperation', 'notcontains')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(payeeBankId, 'ruleOperation', 'containsWords')]))).throw(expected(substitute(payeeBankId, 'ruleOperation', 'containsWords')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(payeeBankId, 'ruleOperation', 'gt')]))).throw(expected(substitute(payeeBankId, 'ruleOperation', 'gt')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(payeeBankId, 'ruleOperation', 'ge')]))).throw(expected(substitute(payeeBankId, 'ruleOperation', 'ge')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(payeeBankId, 'ruleOperation', 'lt')]))).throw(expected(substitute(payeeBankId, 'ruleOperation', 'lt')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(payeeBankId, 'ruleOperation', 'le')]))).throw(expected(substitute(payeeBankId, 'ruleOperation', 'le')));

                        const payeeAccountId = {ruleField: 'payee.payeeAccountId', ruleOperation: 'contains', ruleCriteria: 'account_id' };
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(payeeAccountId, 'ruleOperation', 'contains')]))).throw(expected(substitute(payeeAccountId, 'ruleOperation', 'contains')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(payeeAccountId, 'ruleOperation', 'notcontains')]))).throw(expected(substitute(payeeAccountId, 'ruleOperation', 'notcontains')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(payeeAccountId, 'ruleOperation', 'containsWords')]))).throw(expected(substitute(payeeAccountId, 'ruleOperation', 'containsWords')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(payeeAccountId, 'ruleOperation', 'gt')]))).throw(expected(substitute(payeeAccountId, 'ruleOperation', 'gt')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(payeeAccountId, 'ruleOperation', 'ge')]))).throw(expected(substitute(payeeAccountId, 'ruleOperation', 'ge')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(payeeAccountId, 'ruleOperation', 'lt')]))).throw(expected(substitute(payeeAccountId, 'ruleOperation', 'lt')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute(payeeAccountId, 'ruleOperation', 'le')]))).throw(expected(substitute(payeeAccountId, 'ruleOperation', 'le')));

                        const $baseType = {ruleField: '$baseType', ruleOperation: 'contains', ruleCriteria: 'GBP' };
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute($baseType, 'ruleOperation', 'contains')]))).throw(expected(substitute($baseType, 'ruleOperation', 'contains')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute($baseType, 'ruleOperation', 'notcontains')]))).throw(expected(substitute($baseType, 'ruleOperation', 'notcontains')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute($baseType, 'ruleOperation', 'containsWords')]))).throw(expected(substitute($baseType, 'ruleOperation', 'containsWords')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute($baseType, 'ruleOperation', 'gt')]))).throw(expected(substitute($baseType, 'ruleOperation', 'gt')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute($baseType, 'ruleOperation', 'ge')]))).throw(expected(substitute($baseType, 'ruleOperation', 'ge')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute($baseType, 'ruleOperation', 'lt')]))).throw(expected(substitute($baseType, 'ruleOperation', 'lt')));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleConditions', [substitute($baseType, 'ruleOperation', 'le')]))).throw(expected(substitute($baseType, 'ruleOperation', 'le')));

                        done();
                    } catch(err) {
                        done(err);
                    }
                });
            });

            describe('ruleActions', () => {
                it('should NOT throw when valid', (done) => {
                    try {
                        const validAction = { splitPercentage: 100, splitAmount: undefined, accountantNarrative: 'New rule narrative', accountsPostings: [{ type: 'customer', code: 'CUST1' }] };
                        shouldT(() => Rule.validate(substitute(uut, 'ruleActions', [validAction]))).not.throw();

                        shouldT(() => Rule.validate(substitute(uut, 'ruleActions', [substitute(validAction, 'splitAmount', undefined)]))).not.throw();

                        shouldT(() => Rule.validate(substitute(uut, 'ruleActions', [substitute(validAction, 'splitPercentage', undefined)]))).not.throw();

                        shouldT(() => Rule.validate(substitute(uut, 'ruleActions', [substitute(validAction, 'accountantNarrative', undefined)]))).not.throw();
                        shouldT(() => Rule.validate(substitute(uut, 'ruleActions', [substitute(validAction, 'accountantNarrative', null)]))).not.throw();
                        shouldT(() => Rule.validate(substitute(uut, 'ruleActions', [substitute(validAction, 'accountantNarrative', '')]))).not.throw();

                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                it('should throw when invalid', (done) => {
                    try {
                        const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.ruleActions: should be an array`, { ruleActions: value })], 400));

                        shouldT(() => Rule.validate(substitute(uut, 'ruleActions', undefined))).throw(expected(undefined));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleActions', null))).throw(expected(null));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleActions', 'invalid'))).throw(expected('invalid'));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleActions', ''))).throw(expected(''));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleActions', 9))).throw(expected(9));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleActions', {}))).throw(expected({}));
                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                describe('splitPercentage', () => {
                    it('should throw when invalid', (done) => {
                        try {
                            const final = () => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.ruleActions: invalid final splitPercentage`, {})], 400));
                            const expectedWFinal = (value) => {
                                return new StatusCodeError([
                                    // TODO: Return values are inconsistent
                                    new StatusCodeErrorItem('InvalidProperties', `Object.ruleActions: ${value}`, { ruleActions: value }),
                                    new StatusCodeErrorItem('InvalidProperties', `Rule.ruleActions: invalid final splitPercentage`, {})
                                ], 400);
                            };
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Object.ruleActions: ${value}`, { ruleActions: value })], 400));

                            // get rid of this so it doesn't confuse our tests
                            delete uut.ruleActions[0].splitAmount;

                            const validPercentageAction = { splitPercentage: 100, accountantNarrative: 'New rule narrative', accountsPostings: [{ type: 'customer', code: 'CUST1' }] };
                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].splitPercentage', -1))).throw(expectedWFinal(substitute(validPercentageAction, 'splitPercentage', -1)));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].splitPercentage', 101))).throw(expectedWFinal(substitute(validPercentageAction, 'splitPercentage', 101)));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].splitPercentage', null))).throw(expected(substitute(validPercentageAction, 'splitPercentage', null)));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].splitPercentage', ''))).throw(expected(substitute(validPercentageAction, 'splitPercentage', '')));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].splitPercentage', {}))).throw(expected(substitute(validPercentageAction, 'splitPercentage', {})));

                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].splitPercentage', 99))).throw(final());

                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
                });

                describe('splitAmount', () => {
                    it('should throw when invalid', (done) => {
                        try {
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Object.ruleActions: ${value}`, { ruleActions: value })], 400));

                            const validAmountAction = {
                                splitAmount: 100,
                                accountantNarrative: 'New rule narrative',
                                accountsPostings: [{ type: 'customer', code: 'CUST1' }]
                            };

                            // get rid of this so it doesn't confuse our tests
                            delete uut.ruleActions[0].splitPercentage;
                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].splitAmount', -1))).throw(expected(substitute(validAmountAction, 'splitAmount', -1)));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].splitAmount', null))).throw(expected(substitute(validAmountAction, 'splitAmount', null)));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].splitAmount', ''))).throw(expected(substitute(validAmountAction, 'splitAmount', '')));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].splitAmount', {}))).throw(expected(substitute(validAmountAction, 'splitAmount', {})));

                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
                });

                describe('accountantNarrative', () => {
                    it ('should throw when invalid', (done) => {
                        try {
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Object.ruleActions: ${value}`, { ruleActions: value })], 400));

                            const validNarrativeAction = {
                                splitPercentage: 100,
                                accountantNarrative: 'New rule narrative',
                                accountsPostings: [{ type: 'customer', code: 'CUST1' }]
                            };

                            // get rid of this so it doesn't confuse our tests
                            delete uut.ruleActions[0].splitAmount;

                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountantNarrative', -1))).throw(expected(substitute(validNarrativeAction, 'accountantNarrative', -1)));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountantNarrative', {}))).throw(expected(substitute(validNarrativeAction, 'accountantNarrative', {})));

                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
                });

                describe('accountsPostings', () => {
                    it('should throw when invalid', (done) => {
                        try {
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Object.ruleActions: ${value}`, { ruleActions: value })], 400));

                            const validPostingsAction = { splitPercentage: 100, accountantNarrative: 'New rule narrative', accountsPostings: [{ type: 'customer', code: 'CUST1' }] };
                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountsPostings', undefined))).throw(expected(substitute(validPostingsAction, 'accountsPostings', undefined)));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountsPostings', null))).throw(expected(substitute(validPostingsAction, 'accountsPostings', null)));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountsPostings', 1))).throw(expected(substitute(validPostingsAction, 'accountsPostings', 1)));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountsPostings', {}))).throw(expected(substitute(validPostingsAction, 'accountsPostings', {})));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountsPostings', ''))).throw(expected(substitute(validPostingsAction, 'accountsPostings', '')));

                            done();
                        } catch(err) {
                            done(err);
                        }
                    });

                    describe('type', () => {
                        it('should throw when invalid', (done) => {
                            try {
                                const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Object.ruleActions: ${value}`, { ruleActions: value })], 400));
                                const valid = {
                                    splitPercentage: 100,
                                    accountantNarrative: 'New rule narrative',
                                    accountsPostings: [{ type: 'customer', code: 'CUST1' }]
                                };
                                shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountsPostings[0].type', undefined))).throw(expected(substitute(valid, 'accountsPostings[0].type', undefined)));
                                shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountsPostings[0].type', null))).throw(expected(substitute(valid, 'accountsPostings[0].type', null)));
                                shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountsPostings[0].type', ''))).throw(expected(substitute(valid, 'accountsPostings[0].type', '')));
                                shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountsPostings[0].type', 9))).throw(expected(substitute(valid, 'accountsPostings[0].type', 9)));
                                shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountsPostings[0].type', {}))).throw(expected(substitute(valid, 'accountsPostings[0].type', {})));

                                done();
                            } catch(err) {
                                done(err);
                            }
                        });
                    });

                    describe('code', () => {
                        it('should throw when invalid', (done) => {
                            try {
                                const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Object.ruleActions: ${value}`, { ruleActions: value })], 400));
                                const valid = {
                                    splitPercentage: 100,
                                    accountantNarrative: 'New rule narrative',
                                    accountsPostings: [{ type: 'customer', code: 'CUST1' }]
                                };
                                shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountsPostings[0].code', undefined))).throw(expected(substitute(valid, 'accountsPostings[0].code', undefined)));
                                shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountsPostings[0].code', null))).throw(expected(substitute(valid, 'accountsPostings[0].code', null)));
                                shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountsPostings[0].code', ''))).throw(expected(substitute(valid, 'accountsPostings[0].code', '')));
                                shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountsPostings[0].code', 9))).throw(expected(substitute(valid, 'accountsPostings[0].code', 9)));
                                shouldT(() => Rule.validate(substitute(uut, 'ruleActions[0].accountsPostings[0].code', {}))).throw(expected(substitute(valid, 'accountsPostings[0].code', {})));

                                done();
                            } catch(err) {
                                done(err);
                            }
                        });
                    })
                })
            });

            describe('ruleAdditionalFields', () => {
                it('should NOT throw when valid', (done) => {
                    try {
                        const valid = { name: 'auto-post', value: 'true' };
                        shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields', [valid]))).not.throw();

                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                it('should throw when invalid', (done) => {
                    try {
                        const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.ruleAdditionalFields: should be an array`, { ruleAdditionalFields: value })], 400));

                        shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields', undefined))).throw(expected(undefined));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields', null))).throw(expected(null));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields', 'invalid'))).throw(expected('invalid'));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields', ''))).throw(expected(''));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields', 9))).throw(expected(9));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields', {}))).throw(expected({}));
                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                describe('name', () => {
                    it('should NOT throw when valid', (done) => {
                        try {
                            shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields[0].name', str1Char))).not.throw();
                            shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields[0].name', str50Char))).not.throw();

                            done();
                        } catch(err) {
                            done(err);
                        }
                    });

                    it('should throw when invalid', (done) => {
                        try {
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Object.ruleAdditionalFields: ${value}`, { ruleAdditionalFields: value })], 400));

                            shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields[0].name', undefined))).throw(expected({ name: undefined, value: 'true' }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields[0].name', null))).throw(expected({ name: null, value: 'true' }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields[0].name', ''))).throw(expected({ name: '', value: 'true' }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields[0].name', 9))).throw(expected({ name: 9, value: 'true' }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields[0].name', {}))).throw(expected({ name: {}, value: 'true' }));

                            done();
                        } catch(err) {
                            done(err);
                        }
                    });
                });

                describe('value', () => {
                    it('should NOT throw when valid', (done) => {
                        try {
                            shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields[0].value', str1Char))).not.throw();
                            shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields[0].value', str50Char))).not.throw();

                            done();
                        } catch(err) {
                            done(err);
                        }
                    });

                    it('should throw when invalid', (done) => {
                        try {
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Object.ruleAdditionalFields: ${value}`, { ruleAdditionalFields: value })], 400));

                            shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields[0].value', undefined))).throw(expected({ name: 'auto-post', value: undefined }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields[0].value', null))).throw(expected({ name: 'auto-post', value: null }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields[0].value', ''))).throw(expected({ name: 'auto-post', value: '' }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields[0].value', 9))).throw(expected({ name: 'auto-post', value: 9 }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleAdditionalFields[0].value', {}))).throw(expected({ name: 'auto-post', value: {} }));

                            done();
                        } catch(err) {
                            done(err);
                        }
                    });
                });
            });

            describe('ruleCounts', () => {
                it('should NOT throw when valid', (done) => {
                    try {
                        const valid = {success: 1, fail: 1, applied: 1};
                        shouldT(() => Rule.validate(substitute(uut, 'ruleCounts', valid))).not.throw();
                        shouldT(() => Rule.validate(substitute(uut, 'ruleCounts', undefined))).not.throw();

                        done();
                    } catch (err) {
                        done(err);
                    }
                });

                it('should throw when invalid', (done) => {
                    try {
                        // TODO: clearly wrong
                        const expectedNull = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.ruleCounts: null`, { ruleCounts: value })], 400));
                        const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.ruleCounts: ${value}`, { ruleCounts: value })], 400));

                        shouldT(() => Rule.validate(substitute(uut, 'ruleCounts', null))).throw(expectedNull(null));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleCounts', 'invalid'))).throw(expected('invalid'));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleCounts', ''))).throw(expected(''));
                        shouldT(() => Rule.validate(substitute(uut, 'ruleCounts', 9))).throw(expected(9));
                        //shouldT(() => Rule.validate(substitute(uut, 'ruleCounts', {}))).throw(expected({}));

                        done();
                    } catch (err) {
                        done(err);
                    }
                });

                describe('success', () => {
                    it('should throw when invalid', (done) => {
                        try {
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.ruleCounts: ${value}`, { ruleCounts: value })], 400));

                            shouldT(() => Rule.validate(substitute(uut, 'ruleCounts.success', undefined))).throw(expected({ success: undefined, fail: 1, applied: 2 }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleCounts.success', null))).throw(expected({ success: null, fail: 1, applied: 2}));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleCounts.success', 'invalid'))).throw(expected({ success: 'invalid', fail: 1, applied: 2 }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleCounts.success', ''))).throw(expected({ success: '', fail: 1, applied: 2 }));
                            //shouldT(() => Rule.validate(substitute(uut, 'ruleCounts.success', {}))).throw(expected({ success: {}, fail: 1, applied: 2 }));

                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
                });

                describe('fail', () => {
                    it('should throw when invalid', (done) => {
                        try {
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.ruleCounts: ${value}`, { ruleCounts: value })], 400));

                            shouldT(() => Rule.validate(substitute(uut, 'ruleCounts.fail', undefined))).throw(expected({ success: 3, fail: undefined, applied: 2 }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleCounts.fail', null))).throw(expected({ success: 3, fail: null, applied: 2 }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleCounts.fail', 'invalid'))).throw(expected({ success: 3, fail: 'invalid', applied: 2 }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleCounts.fail', ''))).throw(expected({ success: 3, fail: '', applied: 2 }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleCounts.fail', {}))).throw(expected({ success: 3, fail: {}, applied: 2 }));
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
                });

                describe('applied', () => {
                    it('should throw when invalid', (done) => {
                        try {
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Rule.ruleCounts: ${value}`, { ruleCounts: value })], 400));

                            shouldT(() => Rule.validate(substitute(uut, 'ruleCounts.applied', undefined))).throw(expected({ success: 3, fail: 1, applied: undefined }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleCounts.applied', null))).throw(expected({ success: 3, fail: 1, applied: null }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleCounts.applied', 'invalid'))).throw(expected({ success: 3, fail: 1, applied: 'invalid' }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleCounts.applied', ''))).throw(expected({ success: 3, fail: 1, applied: '' }));
                            shouldT(() => Rule.validate(substitute(uut, 'ruleCounts.applied', {}))).throw(expected({ success: 3, fail: 1, applied: {} }));
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
                });
            });

            it('should not throw for valid data', function (done) {
                try {
                    Rule.validate(uut);
                    done();
                } catch (err) {
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
                    err.items[0].applicationCode.should.eql('InvalidType');

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
                    err.items[0].applicationCode.should.eql('InvalidType');

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
                    err.items[0].applicationCode.should.eql('InvalidType');

                    done();
                }
            });

            it('should throw multiple error items if multiple fields are invalid', function (done) {
                try {
                    uut.uuid = null;
                    uut.ruleName = null;

                    Rule.validate(uut);

                    done(new Error('should have thrown'));
                } catch (err) {

                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items.length.should.eql(2);

                    err.items[0].applicationCode.should.eql('InvalidProperties');
                    err.items[0].params.should.eql({uuid: null});
                    err.items[1].applicationCode.should.eql('InvalidProperties');
                    err.items[1].params.should.eql({ruleName: null});

                    done();
                }
            });

            it('should not throw on validation if noThrow is specified', function (done) {
                try {
                    uut.uuid = null;
                    uut.ruleName = null;

                    var items = Rule.validate(uut, true);

                    should(items).be.an.Array().of.length(2);
                    should(items[0].applicationCode).eql('InvalidProperties');
                    should(items[0].params).eql({uuid: null});
                    should(items[1].applicationCode).eql('InvalidProperties');
                    should(items[1].params).eql({ruleName: null});

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            })
        });

        describe('Rule.filter', function () {
            var uut;

            beforeEach(function () {
                uut = new Rule(data);
            });

            it('should filter out secret & irrelevant info', function (done) {
                var filteredRule = Rule.filter(uut);

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
                            applied: 2,
                            fail: 1,
                            success: 3
                        },
                        ruleAdditionalFields: [{
                            name: 'auto-post',
                            value: 'true'
                        }],
                        targetType: 'Transaction',
                        ruleType: 'User',
                        status: 'active',
                        productId: 'dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc',
                        globalRuleId: null
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
                        globalRuleId: null
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
                    should(oldRule).match(data);

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



// describe('@sage/bc-contracts-rule.Rule', function () {
//     let sandbox;
//     let data;
//
//     beforeEach(function () {
//         sandbox = sinon.createSandbox();
//     });
//
//     afterEach(function () {
//         sandbox.restore();
//     });
//
//     // rules each have targetType, and that target type determines the validation that runs on the rule. This block
//     //  tests specifically the Transaction Rule validation
//     describe('contract.Rule', function () {
//
//         beforeEach(function () {
//             data = {
//                 uuid: '2a867f21-cf12-48f2-914f-5a741e719b27',
//                 ruleName: 'New rule',
//                 ruleRank: 1,
//                 ruleConditions: [{
//                     ruleField: 'transactionAmount',
//                     ruleOperation: 'gt',
//                     ruleCriteria: '10'
//                 }],
//                 ruleActions: [{
//                     splitPercentage: 100,
//                     accountantNarrative: 'New rule narrative',
//                     accountsPostings: [{
//                         type: 'customer',
//                         code: 'CUST1'
//                     }]
//                 }],
//                 ruleCounts: {
//                     applied: 0,
//                     fail: 1,
//                     success: 0
//                 },
//                 status: 'active',
//                 targetType: 'Transaction',
//                 ruleType: 'User',
//                 globalRuleId: undefined
//             };
//         });
//
//         describe('constructor', function () {
//
//             // if ruleAmount = 0, then entirely ignore it and use the rulePercentage instead
//             // if ruleAmount > 0, then use this value and entirely ignore the rulePercentage (i.e. don’t try to validate it!)
//             describe('bug 245861 - tests to support fix for splitAmount and spiltPercentage (8/8/17)', function() {
//                 it('should set ruleActions to empty array if undefined', function(done) {
//                     try {
//                         data.ruleActions = undefined;
//
//                         let uut = new Rule(data);
//
//                         should.exist(uut.ruleActions);
//                         should(uut.ruleActions).eql([]);
//                         should(uut.ruleActions).not.eql(undefined);
//
//                         done();
//                     } catch (err) {
//                         done(err instanceof Error ? err : new Error(err));
//                     }
//
//                 });
//
//                 it('should not have ruleActions.splitAmount if splitAmount === 0', function(done) {
//                     try {
//                         data.ruleActions = [{
//                             splitPercentage: 50,
//                             splitAmount: 0, // will be removed
//                             accountantNarrative: 'New rule narrative 1',
//                             accountsPostings: [{
//                                 type: 'customer',
//                                 code: 'CUST1'
//                             }]
//                         }];
//
//                         let uut = new Rule(data);
//
//                         _.each(uut.ruleActions, action => {
//                             should.not.exist(action.splitAmount);
//                             should.exist(action.splitPercentage);
//                             should(action.splitPercentage).eql(50);
//                         });
//
//                         done();
//                     } catch (err) {
//                         done(err instanceof Error ? err : new Error(err));
//                     }
//
//                 });
//
//                 it('should not have ruleActions.splitPercentage if splitAmount > 0', function(done) {
//                     try {
//                         data.ruleActions = [{
//                             splitPercentage: 50, // will be removed
//                             splitAmount: 5,
//                             accountantNarrative: 'New rule narrative 1',
//                             accountsPostings: [{
//                                 type: 'customer',
//                                 code: 'CUST1'
//                             }]
//                         }];
//
//                         let uut = new Rule(data);
//
//                         _.each(uut.ruleActions, action => {
//                             should.not.exist(action.splitPercentage);
//                             should.exist(action.splitAmount);
//                             should(action.splitAmount).eql(5);
//                         });
//
//                         done();
//                     } catch (err) {
//                         done(err instanceof Error ? err : new Error(err));
//                     }
//                 });
//
//                 it('should not have ruleActions.splitPercentage if splitAmount > 0, or should not have ruleActions.splitAmount if splitAmount === 0 ', function(done) {
//                     try {
//                         data.ruleActions = [{
//                             splitPercentage: 50,
//                             splitAmount: 0, // will be removed
//                             accountantNarrative: 'New rule narrative 1',
//                             accountsPostings: [{
//                                 type: 'customer',
//                                 code: 'CUST1'
//                             }]
//                         },
//                             {
//                                 splitPercentage: 50, // will be removed
//                                 splitAmount: 5,
//                                 accountantNarrative: 'New rule narrative 2',
//                                 accountsPostings: [{
//                                     type: 'customer',
//                                     code: 'CUST1'
//                                 }]
//                             }];
//
//                         let uut = new Rule(data);
//
//                         should.not.exist(uut.ruleActions[0].splitAmount);
//                         should.exist(uut.ruleActions[0].splitPercentage);
//                         should(uut.ruleActions[0].splitPercentage).eql(50);
//
//                         should.not.exist(uut.ruleActions[1].splitPercentage);
//                         should.exist(uut.ruleActions[1].splitAmount);
//                         should(uut.ruleActions[1].splitAmount).eql(5);
//
//                         done();
//                     } catch (err) {
//                         done(err instanceof Error ? err : new Error(err));
//                     }
//                 });
//
//             });
//
//             it('should create an instance of Rule using Create', function (done) {
//                 try {
//                     var uut = Rule.Create(data);
//                     uut.should.be.instanceof(Rule);
//
//                     done();
//                 } catch (err) {
//                     done(err instanceof Error ? err : new Error(err));
//                 }
//             });
//
//             it('should assign properties using Create', function (done) {
//                 try {
//                     data.productId = 'dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc';
//                     var uut = Rule.Create(data);
//                     should(uut.uuid).eql(data.uuid);
//                     should(uut.ruleName).eql(data.ruleName);
//                     should(uut.ruleRank).eql(data.ruleRank);
//                     should(uut.ruleConditions).eql(data.ruleConditions);
//                     should(uut.ruleActions).eql(data.ruleActions);
//                     should(uut.status).eql(data.status);
//                     should(uut.targetType).eql(data.targetType);
//                     should(uut.ruleType).eql(data.ruleType);
//                     should(uut.productId).eql(data.productId);
//                     should(uut.globalRuleId).eql(data.globalRuleId);
//                     should(uut.ruleCounts).eql(data.ruleCounts);
//
//                     done();
//                 } catch (err) {
//                     done(err instanceof Error ? err : new Error(err));
//                 }
//             });
//
//             it('should create an instance of Rule', function (done) {
//                 try {
//                     var uut = new Rule(data);
//                     uut.should.be.instanceof(Rule);
//
//                     done();
//                 } catch (err) {
//                     done(err instanceof Error ? err : new Error(err));
//                 }
//             });
//
//             it('should assign properties', function (done) {
//                 try {
//                     data.productId = 'dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc';
//                     var uut = new Rule(data);
//                     should(uut.uuid).eql(data.uuid);
//                     should(uut.ruleName).eql(data.ruleName);
//                     should(uut.ruleRank).eql(data.ruleRank);
//                     should(uut.ruleConditions).eql(data.ruleConditions);
//                     should(uut.ruleActions).eql(data.ruleActions);
//                     should(uut.status).eql(data.status);
//                     should(uut.targetType).eql(data.targetType);
//                     should(uut.ruleType).eql(data.ruleType);
//                     should(uut.productId).eql(data.productId);
//                     should(uut.globalRuleId).eql(data.globalRuleId);
//                     should(uut.ruleCounts).eql(data.ruleCounts);
//
//                     done();
//                 } catch (err) {
//                     done(err instanceof Error ? err : new Error(err));
//                 }
//             });
//
//             it('should not assign properties not on contract', function (done) {
//                 try {
//                     data.junk = 'wahwahwah';
//                     var uut = new Rule(data);
//                     should.not.exists(uut.junk);
//
//                     done();
//                 } catch (err) {
//                     done(err instanceof Error ? err : new Error(err));
//                 }
//             });
//
//             it('should assign default properties', function (done) {
//                 try {
//                     const uut = new Rule({});
//                     should(uut.status).eql(Rule.statuses.active);
//                     should(uut.ruleConditions).eql([]);
//
//                     done();
//                 } catch (err) {
//                     done(err instanceof Error ? err : new Error(err));
//                 }
//             });
//
//         });
//
//         describe('Rule.prototype.validate', function () {
//             it('should call Rule.validate', function (done) {
//                 sandbox.stub(Rule, 'validate');
//
//                 try {
//                     var uut = new Rule(data);
//                     Rule.validate(uut);
//
//                     Rule.validate.callCount.should.eql(1);
//                     Rule.validate.calledWithExactly(uut).should.eql(true);
//
//                     done();
//                 } catch (err) {
//                     done(err instanceof Error ? err : new Error(err));
//                 }
//             });
//         });
//
//         describe('Rule.validate', function () {
//             let uut;
//
//             beforeEach(function () {
//                 uut = new Rule(data);
//             });
//
//             it('should validate and throw', (done) => {
//                 try {
//                     delete uut.ruleName;
//                     uut.validate();
//
//                     done(new Error('should have thrown'));
//                 } catch (err) {
//
//                     err.should.be.instanceOf(StatusCodeError);
//                     err.statusCode.should.eql(400);
//                     err.items[0].applicationCode.should.eql('InvalidProperties');
//
//                     done();
//                 }
//             });
//
//             it('should validate and not throw', (done) => {
//                 try {
//                     delete uut.ruleName;
//                     const response = uut.validate(true);
//                     response[0].applicationCode.should.eql('InvalidProperties');
//                     done();
//                 } catch (err) {
//                     done(err instanceof Error ? err : new Error(err));
//                 }
//             });
//
//             const tests = [{
//                 target: 'uuid', tests: [
//                     {it: 'should not throw if uuid is undefined', value: undefined, error: false},
//                     {it: 'should throw if uuid is null', value: null, error: true},
//                     {it: 'should throw if uuid is an empty string', value: '', error: true},
//                     {it: 'should throw if uuid is not a valid uuid', value: 'not-a-uuid', error: true},
//                     {it: 'should throw if uuid is a number', value: 9, error: true},
//                     {it: 'should throw if uuid is an object', value: {}, error: true}
//                 ]
//             }, {
//                 target: 'ruleRank', tests: [
//                     { it: 'should not throw if ruleRank is a positive integer', value: 1, error: false },
//                     { it: 'should throw if ruleRank is a negative integer', value: -1, error: true },
//                     { it: 'should throw if ruleRank is zero', value: 0, error: true },
//                     { it: 'should throw if ruleRank is a decimal number', value: 1.5, error: true },
//                     { it: 'should throw if ruleRank is a string', value: '1', error: true },
//                     { it: 'should throw if ruleRank is an empty string', value: '', error: true },
//                     { it: 'should throw if ruleRank is an object', value: {}, error: true },
//                     { it: 'should not throw if ruleRank is null', value: null, error: false },
//                     { it: 'should not throw if ruleRank is undefined', value: undefined, error: false }
//                 ]
//             }, {
//                 target: 'status', tests: [
//                     {it: 'should not throw if status is a active', value: 'active', error: false},
//                     {it: 'should not throw if status is a inactive', value: 'inactive', error: false},
//                     {it: 'should throw if status is a some other string', value: 'rule_name', error: true},
//                     {it: 'should throw if status is undefined', value: undefined, error: true},
//                     {it: 'should throw if status is null', value: null, error: true},
//                     {it: 'should throw if status is an empty string', value: '', error: true},
//                     {it: 'should throw if status is a number', value: 9, error: true},
//                     {it: 'should throw if status is an object', value: {}, error: true}
//                 ]
//             }, {
//                 target: 'targetType', tests: [
//                     {it: 'should not throw if targetType is a Transaction', value: 'Transaction', error: false},
//                     {it: 'should not throw if targetType is a some other string', value: 'Company', error: true},
//                     {it: 'should throw if targetType is undefined', value: undefined, error: true},
//                     {it: 'should throw if targetType is null', value: null, error: true},
//                     {it: 'should throw if targetType is an empty string', value: '', error: true},
//                     {it: 'should throw if targetType is a number', value: 9, error: true},
//                     {it: 'should throw if targetType is an object', value: {}, error: true}
//                 ]
//             }, {
//                 target: 'ruleConditions', tests: [
//                     {
//                         it: 'should not throw if ruleConditions is a valid field',
//                         value: [{ruleField: 'transactionAmount', ruleOperation: 'eq', ruleCriteria: '100'}],
//                         error: false
//                     },
//                     {
//                         it: 'should not throw if ruleConditions.ruleOperation is a valid string',
//                         value: [{ruleField: 'transactionAmount', ruleOperation: 'eq', ruleCriteria: '100'}],
//                         error: false
//                     },
//                     {
//                         it: 'should throw if ruleConditions is an invalid field',
//                         value: [{ruleField: 'name', ruleOperation: 'eq', ruleCriteria: 'Name'}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions is an invalid string',
//                         value: [{ruleField: 'badger', ruleOperation: 'eq', ruleCriteria: 'badger'}],
//                         error: true
//                     },
//                     {it: 'should throw if ruleConditions is undefined', value: undefined, error: true},
//                     {it: 'should throw if ruleConditions is null', value: null, error: true},
//                     {it: 'should throw if ruleConditions is an empty object', value: {}, error: true},
//                     {it: 'should throw if ruleConditions is a string', value: '', error: true},
//                     {it: 'should throw if ruleConditions is a some other string', value: 'Company', error: true},
//                     {it: 'should throw if ruleConditions is a number', value: 9, error: true},
//                     {it: 'should throw if ruleConditions is an object', value: {}, error: true},
//                     {
//                         it: 'should throw if ruleConditions.ruleField is an invalid string',
//                         value: [{ruleField: 'invalid', ruleOperation: '=', ruleCriteria: 'temp'}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.ruleField is undefined',
//                         value: [{ruleField: undefined, ruleOperation: '=', ruleCriteria: 'temp'}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.ruleField is null',
//                         value: [{ruleField: null, ruleOperation: '=', ruleCriteria: 'temp'}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.ruleField is a number',
//                         value: [{ruleField: 9, ruleOperation: '=', ruleCriteria: 'temp'}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.ruleField is an object',
//                         value: [{ruleField: {}, ruleOperation: '=', ruleCriteria: 'temp'}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.ruleField is an empty string',
//                         value: [{ruleField: '', ruleOperation: '=', ruleCriteria: 'temp'}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.ruleOperation is an invalid string',
//                         value: [{ruleField: 'transactionAmount', ruleOperation: 'invalid', ruleCriteria: 'temp'}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.ruleOperation is undefined',
//                         value: [{ruleField: 'transactionAmount', ruleOperation: undefined, ruleCriteria: 'temp'}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.ruleOperation is null',
//                         value: [{ruleField: 'transactionAmount', ruleOperation: null, ruleCriteria: 'temp'}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.ruleOperation is a number',
//                         value: [{ruleField: 'transactionAmount', ruleOperation: 9, ruleCriteria: 'temp'}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.ruleOperation is an object',
//                         value: [{ruleField: 'transactionAmount', ruleOperation: {}, ruleCriteria: 'temp'}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.ruleOperation is empty string',
//                         value: [{ruleField: 'transactionAmount', ruleOperation: '', ruleCriteria: 'temp'}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.ruleCriteria is an empty',
//                         value: [{ruleField: 'transactionAmount', ruleOperation: '=', ruleCriteria: ''}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.ruleCriteria is undefined',
//                         value: [{ruleField: 'transactionAmount', ruleOperation: '=', ruleCriteria: undefined}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.ruleCriteria is null',
//                         value: [{ruleField: 'transactionAmount', ruleOperation: '=', ruleCriteria: null}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.ruleCriteria is a number',
//                         value: [{ruleField: 'transactionAmount', ruleOperation: '=', ruleCriteria: 9}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.ruleCriteria is an object',
//                         value: [{ruleField: 'transactionAmount', ruleOperation: '=', ruleCriteria: {}}],
//                         error: true
//                     }
//                 ]
//             }, {
//                 target: 'ruleActions', tests: [
//                     {it: 'should throw if ruleActions is undefined', value: undefined, error: true},
//                     {it: 'should throw if ruleActions is null', value: null, error: true},
//                     {it: 'should throw if ruleActions is an empty object', value: {}, error: true},
//                     {it: 'should throw if ruleActions is a string', value: '', error: true},
//                     {it: 'should throw if ruleActions is a some other string', value: 'Company', error: true},
//                     {it: 'should throw if ruleActions is a number', value: 9, error: true},
//                     {it: 'should throw if ruleActions is an object', value: {}, error: true},
//                     {
//                         it: 'should throw if ruleActions.splitAmount is a negative number',
//                         value: [{
//                             splitAmount: -1,
//                             accountantNarrative: 'temp',
//                             accountsPostings: [{type: 'type', code: 'code'}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should not throw if ruleActions.splitAmount is undefined',
//                         value: [{
//                             splitAmount: undefined,
//                             splitPercentage: 100,
//                             accountantNarrative: 'temp',
//                             accountsPostings: [{type: 'type', code: 'code'}]
//                         }],
//                         error: false
//                     },
//                     {
//                         it: 'should not throw if ruleActions.splitAmount is null',
//                         value: [{
//                             splitAmount: null,
//                             splitPercentage: 100,
//                             accountantNarrative: 'temp',
//                             accountsPostings: [{type: 'type', code: 'code'}]
//                         }],
//                         error: true  // removed allow null as not nullable in client library
//                     },
//                     {
//                         it: 'should throw if ruleActions.splitAmount is a string',
//                         value: [{
//                             splitAmount: 'invalid',
//                             accountantNarrative: 'temp',
//                             accountsPostings: [{type: 'type', code: 'code'}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleActions.splitAmount is an object',
//                         value: [{
//                             splitAmount: {},
//                             accountantNarrative: 'temp',
//                             accountsPostings: [{type: 'type', code: 'code'}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleActions.splitPercentage is a negative number',
//                         value: [{
//                             splitPercentage: -1,
//                             accountantNarrative: 'temp',
//                             accountsPostings: [{type: 'type', code: 'code'}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleActions.splitPercentage is a over 100',
//                         value: [{
//                             splitPercentage: 101,
//                             accountantNarrative: 'temp',
//                             accountsPostings: [{type: 'type', code: 'code'}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should not throw if ruleActions.splitPercentage is undefined',
//                         value: [{
//                             splitPercentage: undefined,
//                             accountantNarrative: 'temp',
//                             accountsPostings: [{type: 'type', code: 'code'}]
//                         }],
//                         error: false
//                     },
//                     {
//                         it: 'should not throw if ruleActions.splitPercentage is null',
//                         value: [{
//                             splitAmount: 100,
//                             splitPercentage: null,
//                             accountantNarrative: 'temp',
//                             accountsPostings: [{type: 'type', code: 'code'}]
//                         }],
//                         error: true  // removed allow null as not nullable in client library
//                     },
//                     {
//                         it: 'should throw if ruleActions.splitPercentage is a string',
//                         value: [{
//                             splitAmount: 100,
//                             splitPercentage: 'invalid',
//                             accountantNarrative: 'temp',
//                             accountsPostings: [{type: 'type', code: 'code'}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleActions.splitPercentage is an object',
//                         value: [{
//                             splitPercentage: {},
//                             accountantNarrative: 'temp',
//                             accountsPostings: [{type: 'type', code: 'code'}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should not throw if ruleConditions.accountantNarrative is an empty string',
//                         value: [{
//                             splitPercentage: 100,
//                             accountantNarrative: '',
//                             accountsPostings: [{type: 'type', code: 'code'}]
//                         }],
//                         error: false
//                     },
//                     {
//                         it: 'should not throw if ruleConditions.accountantNarrative is undefined',
//                         value: [{
//                             splitPercentage: 100,
//                             accountantNarrative: undefined,
//                             accountsPostings: [{type: 'type', code: 'code'}]
//                         }],
//                         error: false
//                     },
//                     {
//                         it: 'should not throw if ruleConditions.accountantNarrative is null',
//                         value: [{
//                             splitPercentage: 100,
//                             accountantNarrative: null,
//                             accountsPostings: [{type: 'type', code: 'code'}]
//                         }],
//                         error: false
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountantNarrative is a number',
//                         value: [{
//                             splitPercentage: 100,
//                             accountantNarrative: 0,
//                             accountsPostings: [{type: 'type', code: 'code'}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountantNarrative is an object',
//                         value: [{
//                             splitPercentage: 100,
//                             accountantNarrative: {},
//                             accountsPostings: [{type: 'type', code: 'code'}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountsPostings is an empty string',
//                         value: [{splitPercentage: 100, accountantNarrative: 'narrative', accountsPostings: ''}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountsPostings is undefined',
//                         value: [{splitPercentage: 100, accountantNarrative: 'narrative', accountsPostings: undefined}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountsPostings is null',
//                         value: [{splitPercentage: 100, accountantNarrative: 'narrative', accountsPostings: null}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountsPostings is a number',
//                         value: [{splitPercentage: 100, accountantNarrative: 'narrative', accountsPostings: 9}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountsPostings is an object',
//                         value: [{splitPercentage: 100, accountantNarrative: 'narrative', accountsPostings: {}}],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountsPostings.type is an empty string',
//                         value: [{
//                             splitPercentage: 100,
//                             accountantNarrative: 'narrative',
//                             accountsPostings: [{type: '', code: 'code'}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountsPostings.type is undefined',
//                         value: [{
//                             splitPercentage: 100,
//                             accountantNarrative: 'narrative',
//                             accountsPostings: [{type: undefined, code: 'code'}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountsPostings.type is null',
//                         value: [{
//                             splitPercentage: 100,
//                             accountantNarrative: 'narrative',
//                             accountsPostings: [{type: null, code: 'code'}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountsPostings.type is a number',
//                         value: [{
//                             splitPercentage: 100,
//                             accountantNarrative: 'narrative',
//                             accountsPostings: [{type: 9, code: 'code'}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountsPostings.type is an object',
//                         value: [{
//                             splitPercentage: 100,
//                             accountantNarrative: 'narrative',
//                             accountsPostings: [{type: {}, code: 'code'}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountsPostings.code is an empty string',
//                         value: [{
//                             splitPercentage: 100,
//                             accountantNarrative: 'narrative',
//                             accountsPostings: [{type: 'type', code: ''}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountsPostings.code is undefined',
//                         value: [{
//                             splitPercentage: 100,
//                             accountantNarrative: 'narrative',
//                             accountsPostings: [{type: 'type', code: undefined}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountsPostings.code is null',
//                         value: [{
//                             splitPercentage: 100,
//                             accountantNarrative: 'narrative',
//                             accountsPostings: [{type: 'type', code: null}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountsPostings.code is a number',
//                         value: [{
//                             splitPercentage: 100,
//                             accountantNarrative: 'narrative',
//                             accountsPostings: [{type: 'type', code: 0}]
//                         }],
//                         error: true
//                     },
//                     {
//                         it: 'should throw if ruleConditions.accountsPostings.code is an object',
//                         value: [{
//                             splitPercentage: 100,
//                             accountantNarrative: 'narrative',
//                             accountsPostings: [{type: 'type', code: {}}]
//                         }],
//                         error: true
//                     }
//                 ]
//             }, {
//                 target: 'counts', tests: [
//                     {
//                         it: 'should not throw if counts.applied is a number ',
//                         value: [{ruleField: 'applied', ruleOperation: 'eq', ruleCriteria: 100}],
//                         error: false
//                     },
//                     {
//                         it: 'should not throw if counts.fail is a number',
//                         value: [{ruleField: 'fail', ruleOperation: 'eq', ruleCriteria: 100}],
//                         error: false
//                     },
//                     {
//                         it: 'should not throw if counts.applied is a number',
//                         value: [{ruleField: 'applied', ruleOperation: 'eq', ruleCriteria: 100}],
//                         error: false
//                     },
//                     {
//                         it: 'should throw if counts.applied is a string ',
//                         value: [{ruleField: 'applied', ruleOperation: 'eq', ruleCriteria: 'a'}],
//                         error: false
//                     },
//                     {
//                         it: 'should throw if counts.fail is a string',
//                         value: [{ruleField: 'fail', ruleOperation: 'eq', ruleCriteria: 'a'}],
//                         error: false
//                     },
//                     {
//                         it: 'should throw if counts.applied is a number',
//                         value: [{ruleField: 'applied', ruleOperation: 'eq', ruleCriteria: 'a'}],
//                         error: false
//                     }
//                 ]
//             }];
//
//             var runTest = function (target, tests) {
//                 describe(target, function () {
//                     _.each(tests, function (test, index) {
//                         it(test.it, function (done) {
//                             try {
//                                 uut[target] = test.value;
//                                 var result = test.error ? new Error(target + ' test ' + index + ': should have thrown') : undefined;
//
//                                 Rule.validate(uut);
//
//                                 done(result);
//                             } catch (err) {
//                                 if (!test.error) {
//                                     console.log(err);
//                                     done((err instanceof Error) ? err : new Error());
//                                 } else {
//                                     console.log(err);
//                                     err.should.be.instanceOf(StatusCodeError);
//                                     err.statusCode.should.eql(400);
//                                     err.items[0].applicationCode.should.eql('InvalidProperties');
//                                     console.log(err.items[0].params);
//                                     if (_.isArray(test.value)) {
//                                         console.log('____target', target);
//                                         console.log('XXX Array', err.items[0].params[target]);
//                                         console.log('XXX Array test val', test.value[0]);
//                                     } else {
//                                         console.log('XXX item', err.items[0].params[target]);
//                                         console.log('XXX Array test val', test.value);
//                                     }
//
//                                     should(err.items[0].params[target]).eql(_.isArray(test.value) ? test.value[0] : test.value);
//
//                                     done();
//                                 }
//                             }
//                         })
//                     })
//                 })
//             };
//
//             _.each(tests, function (test) {
//                 runTest(test.target, test.tests);
//             });
//
//             it('should not throw for valid data', function (done) {
//                 try {
//                     Rule.validate(uut);
//                     done();
//                 } catch (err) {
//                     console.log(err);
//                     done((err instanceof Error) ? err : new Error());
//                 }
//             });
//
//             it('should throw if rule is undefined', function (done) {
//                 try {
//                     Rule.validate(undefined);
//
//                     done(new Error('should have thrown'));
//                 } catch (err) {
//
//                     err.should.be.instanceOf(StatusCodeError);
//                     err.statusCode.should.eql(400);
//                     err.items[0].applicationCode.should.eql('InvalidType');
//
//                     done();
//                 }
//             });
//
//             it('should throw if rule is null', function (done) {
//                 try {
//                     Rule.validate(null);
//
//                     done(new Error('should have thrown'));
//                 } catch (err) {
//
//                     err.should.be.instanceof(StatusCodeError);
//                     err.statusCode.should.eql(400);
//                     err.items[0].applicationCode.should.eql('InvalidType');
//
//                     done();
//                 }
//             });
//
//             it('should throw if rule is not an instance of Rule', function (done) {
//                 try {
//                     Rule.validate({});
//
//                     done(new Error('should have thrown'));
//                 } catch (err) {
//
//                     err.should.be.instanceof(StatusCodeError);
//                     err.statusCode.should.eql(400);
//                     err.items[0].applicationCode.should.eql('InvalidType');
//
//                     done();
//                 }
//             });
//
//             it('should throw multiple error items if multiple fields are invalid', function (done) {
//                 try {
//                     uut.uuid = null;
//                     uut.ruleName = null;
//
//                     Rule.validate(uut);
//
//                     done(new Error('should have thrown'));
//                 } catch (err) {
//
//                     err.should.be.instanceOf(StatusCodeError);
//                     err.statusCode.should.eql(400);
//                     err.items.length.should.eql(2);
//
//                     err.items[0].applicationCode.should.eql('InvalidProperties');
//                     err.items[0].params.should.eql({uuid: null});
//                     err.items[0].message.should.eql('Rule.uuid: null');
//                     err.items[1].applicationCode.should.eql('InvalidProperties');
//                     err.items[1].params.should.eql({ruleName: null});
//                     err.items[1].message.should.eql('Rule.ruleName: null');
//
//                     done();
//                 }
//             });
//
//             it('should not throw on validation if noThrow is specified', function (done) {
//                 try {
//                     uut.uuid = null;
//                     uut.ruleName = null;
//
//                     var items = Rule.validate(uut, true);
//
//                     should(items).be.an.Array().of.length(2);
//                     should(items[0].applicationCode).eql('InvalidProperties');
//                     should(items[0].params).eql({uuid: null});
//                     should(items[1].applicationCode).eql('InvalidProperties');
//                     should(items[1].params).eql({ruleName: null});
//
//                     done();
//                 } catch (err) {
//                     done(err instanceof Error ? err : new Error(err));
//                 }
//             })
//         });
//
//         describe('Rule.filter', function () {
//             var uut;
//
//             beforeEach(function () {
//                 uut = new Rule(data);
//             });
//
//             it('should filter out secret & irrelevant info', function (done) {
//                 var filteredRule = Rule.filter(uut);
//
//                 should.not.exists(filteredRule.created);
//                 should.not.exists(filteredRule.updated);
//                 should.not.exists(filteredRule.etag);
//
//                 should.exists(filteredRule.uuid);
//                 should.exists(filteredRule.ruleName);
//                 should.exists(filteredRule.ruleConditions);
//                 should.exists(filteredRule.ruleActions);
//
//                 done();
//             });
//         });
//
//         describe('Rule.extend', function () {
//
//             var oldRule;
//
//             beforeEach(function () {
//                 data.productId = 'dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc';
//                 oldRule = new Rule(data);
//             });
//
//             it('should filter out properties that do not belong to rule', function (done) {
//                 try {
//                     var test = JSON.parse(JSON.stringify(oldRule));
//                     test.ruleName = 'modified_name';
//                     test.additional1 = 'should_be_stripped';
//                     test.ruleName2 = 'should_be_stripped';
//                     test.ruleNamee = 'should_be_stripped';
//
//                     var extended = Rule.extend(oldRule, test, 'post');
//
//                     should(extended).eql({
//                         uuid: '2a867f21-cf12-48f2-914f-5a741e719b27',
//                         ruleName: 'modified_name',
//                         ruleRank: 1,
//                         ruleConditions: [{
//                             ruleField: 'transactionAmount',
//                             ruleOperation: 'gt',
//                             ruleCriteria: '10'
//                         }],
//                         ruleActions: [{
//                             splitPercentage: 100,
//                             accountantNarrative: 'New rule narrative',
//                             accountsPostings: [{
//                                 type: 'customer',
//                                 code: 'CUST1'
//                             }]
//                         }],
//                         ruleCounts: {
//                             applied: 0,
//                             fail: 1,
//                             success: 0
//                         },
//                         targetType: 'Transaction',
//                         ruleType: 'User',
//                         status: 'active',
//                         productId: 'dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc',
//                         globalRuleId: undefined,
//                     });
//
//                     done();
//                 } catch (err) {
//                     done(err instanceof Error ? err : new Error(err));
//                 }
//             });
//
//             it('should remove non-readonly properties from the old rule if using put', function (done) {
//                 try {
//                     var test = {
//                         ruleName: 'modified_name',
//                         additional1: 'should_be_stripped',
//                         ruleName2: 'should_be_stripped',
//                         ruleNamee: 'should_be_stripped'
//                     };
//
//                     var extended = Rule.extend(oldRule, test, 'put');
//
//                     should(extended).eql({
//                         uuid: '2a867f21-cf12-48f2-914f-5a741e719b27',
//                         ruleName: 'modified_name',
//                         ruleType: 'User',
//                         targetType: 'Transaction',
//                         productId: 'dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc',
//                         globalRuleId: undefined,
//                     });
//
//                     done();
//                 } catch (err) {
//                     done(err instanceof Error ? err : new Error(err));
//                 }
//             });
//
//             it('should not modify the old rule', function (done) {
//                 try {
//                     var test = {
//                         ruleName: 'modified_name',
//                         additional1: 'should_be_stripped',
//                         ruleName2: 'should_be_stripped',
//                         ruleNamee: 'should_be_stripped'
//                     };
//
//                     Rule.extend(oldRule, test, 'put');
//                     should(oldRule.uuid).eql(data.uuid);
//                     should(oldRule.ruleName).eql(data.ruleName);
//                     should(oldRule.ruleRank).eql(data.ruleRank);
//                     should(oldRule.ruleConditions).eql(data.ruleConditions);
//                     should(oldRule.ruleActions).eql(data.ruleActions);
//                     should(oldRule.status).eql(data.status);
//                     should(oldRule.targetType).eql(data.targetType);
//                     should(oldRule.ruleType).eql(data.ruleType);
//                     should(oldRule.productId).eql(data.productId);
//                     should(oldRule.globalRuleId).eql(data.globalRuleId);
//                     should(oldRule.ruleCounts).eql(data.ruleCounts);
//                     should(oldRule.additional1).eql(undefined);
//                     should(oldRule.ruleName2).eql(undefined);
//                     should(oldRule.ruleNamee).eql(undefined);
//
//                     done();
//                 } catch (err) {
//                     done(err instanceof Error ? err : new Error(err));
//                 }
//             });
//         });
//
//         describe('Rule sort', () => {
//
//             it('should sort rules based on rank', (done) => {
//                 const rule1 = new Rule(data);
//                 rule1.ruleType = Rule.ruleTypes.global;
//                 rule1.ruleRank = 3;
//                 const rule2 = new Rule(data);
//                 rule2.ruleType = Rule.ruleTypes.feedback;
//                 rule2.ruleRank = 2;
//                 const rule3 = new Rule(data);
//                 rule3.ruleType = Rule.ruleTypes.user;
//                 rule3.ruleRank = 1;
//                 const rules = [
//                     rule1, rule2, rule3
//                 ];
//                 const orderedRules = Rule.sortRulesByRank(rules);
//                 should(orderedRules[0].ruleType).eql(Rule.ruleTypes.user);
//                 should(orderedRules[1].ruleType).eql(Rule.ruleTypes.feedback);
//                 should(orderedRules[2].ruleType).eql(Rule.ruleTypes.global);
//                 done();
//             });
//         });
//
//         describe('GetRuleTypesToProcess', () => {
//
//             it('should return user and accountant if bankaccount.featureOptions.autoCreateRules is false', (done) => {
//                 const bankAccount = { featureOptions: { autoCreateRules: false } };
//                 const types = Rule.GetRuleTypesToProcess(bankAccount);
//                 types.should.eql([Rule.ruleTypes.user, Rule.ruleTypes.accountant]);
//                 done();
//             });
//
//             it('should return user, accountant, feedback and global if bankaccount.featureOptions.autoCreateRules is true', (done) => {
//                 const bankAccount = { featureOptions: { autoCreateRules: true } };
//                 const types = Rule.GetRuleTypesToProcess(bankAccount);
//                 types.should.eql([Rule.ruleTypes.user, Rule.ruleTypes.accountant, Rule.ruleTypes.feedback, Rule.ruleTypes.global]);
//                 done();
//             })
//
//         })
//
//         describe('CreateFromActualActionImpl', () => {
//             it('Should create a rule with a single accounts posting', (done) => {
//                 let transaction = require('./data/actualActionTransaction.json');
//                 let newFeedbackRule = Rule.createFromActualAction(transaction, transaction.transactionNarrative);
//
//                 //console.log('** FeedBack Rule:', JSON.stringify(newFeedbackRule));
//                 newFeedbackRule.validate();
//
//                 should(newFeedbackRule.ruleName).eql('Feedback Rule: Ref001');
//                 should(newFeedbackRule.ruleRank).eql(1);
//
//                 should(newFeedbackRule.ruleConditions.length).eql(1);
//                 should(newFeedbackRule.ruleConditions[0].ruleField).eql('transactionNarrative');
//                 should(newFeedbackRule.ruleConditions[0].ruleOperation).eql('containsWords');
//                 should(newFeedbackRule.ruleConditions[0].ruleCriteria).eql('Ref001');
//
//                 should(newFeedbackRule.ruleActions.length).eql(1);
//                 should(newFeedbackRule.ruleActions[0].splitPercentage).eql(100);
//                 should(newFeedbackRule.ruleActions[0].accountantNarrative).eql('narrative');
//                 should(newFeedbackRule.ruleActions[0].accountsPostings.length).eql(1);
//                 should(newFeedbackRule.ruleActions[0].accountsPostings[0].type).eql('supplier');
//                 should(newFeedbackRule.ruleActions[0].accountsPostings[0].code).eql('SUPP1');
//
//                 done();
//             })
//
//             it('Should create rule with mutliple accounts postings and split percentage', (done) => {
//                 let transaction = require('./data/actualActionTransactionMultiplePostings.json');
//                 let newFeedbackRule = Rule.createFromActualAction(transaction, transaction.transactionNarrative);
//
//                 //console.log('** FeedBack Rule:', JSON.stringify(newFeedbackRule));
//                 newFeedbackRule.validate();
//
//                 should(newFeedbackRule.ruleName).eql('Feedback Rule: Ref001');
//                 should(newFeedbackRule.ruleRank).eql(1);
//
//                 should(newFeedbackRule.ruleConditions.length).eql(1);
//                 should(newFeedbackRule.ruleConditions[0].ruleField).eql('transactionNarrative');
//                 should(newFeedbackRule.ruleConditions[0].ruleOperation).eql('containsWords');
//                 should(newFeedbackRule.ruleConditions[0].ruleCriteria).eql('Ref001');
//
//                 should(newFeedbackRule.ruleActions.length).eql(3);
//                 should(newFeedbackRule.ruleActions[0].splitPercentage).eql(20);
//                 should(newFeedbackRule.ruleActions[0].accountantNarrative).eql('narrative');
//                 should(newFeedbackRule.ruleActions[0].accountsPostings.length).eql(1);
//                 should(newFeedbackRule.ruleActions[0].accountsPostings[0].type).eql('supplier');
//                 should(newFeedbackRule.ruleActions[0].accountsPostings[0].code).eql('SUPP2');
//
//                 should(newFeedbackRule.ruleActions[1].splitPercentage).eql(50);
//                 should(newFeedbackRule.ruleActions[1].accountantNarrative).eql('narrative');
//                 should(newFeedbackRule.ruleActions[1].accountsPostings.length).eql(1);
//                 should(newFeedbackRule.ruleActions[1].accountsPostings[0].type).eql('supplier');
//                 should(newFeedbackRule.ruleActions[1].accountsPostings[0].code).eql('SUPP1');
//
//                 should(newFeedbackRule.ruleActions[2].splitPercentage).eql(100);
//                 should(newFeedbackRule.ruleActions[2].accountantNarrative).eql('narrative');
//                 should(newFeedbackRule.ruleActions[2].accountsPostings.length).eql(1);
//                 should(newFeedbackRule.ruleActions[2].accountsPostings[0].type).eql('supplier');
//                 should(newFeedbackRule.ruleActions[2].accountsPostings[0].code).eql('SUPP3');
//
//                 done();
//
//             })
//         })
//     })
// });