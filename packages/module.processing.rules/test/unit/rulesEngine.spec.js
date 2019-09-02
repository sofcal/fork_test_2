'use strict';

const { Rule } = require('@sage/bc-contracts-rule');
const RulesEngine = require('../../lib/RulesEngine');
const Big = require('bignumber.js');
const should = require('should');
const sinon = require('sinon');

describe('@sage/bc-processing-rules.RulesEngine', function () {
    let sandbox;

    let log;

    let engine;
    let activity;
    let entities;

    beforeEach(function () {
        log = (level, data) => console.log(level + ' ' + JSON.stringify(data));
        activity = { log };

        sandbox = sinon.sandbox.create();

        engine = RulesEngine.Create(activity);

        entities = [{
            entityType: 'supplier',
            entityCode: 'SUPP1',
            entityName: 'supplier_1_ltd',
            entityStatus: 'active'
        }, {
            entityType: 'customer',
            entityCode: 'CUST1',
            entityName: 'customer_1_ltd',
            entityStatus: 'on hold'
        }, {
            entityType: 'nominal',
            entityCode: '0050',
            entityName: 'some_name',
            entityStatus: 'active'
        }, {
            entityType: 'tax',
            entityCode: 'T1',
            entityName: 'tax_1',
            entityStatus: 'active',
            entityValue: 10
        }, {
            entityType: 'nominal',
            entityCode: '0011',
            entityName: 'noStatus'
        }];
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', function () {
        it('should create an instance of RulesEngine', function (done) {
            try {
                should(engine).be.instanceof(RulesEngine);
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should assign properties', function (done) {
            try {
                should(engine._activity).eql(activity);
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('processRules', function () {

        let transactions, rules;

        context('client', () => {

            beforeEach(() => {
                transactions = [{
                    transactionHash: '0f31e35e',
                    transactionNarrative: 'narrative1',
                    transactionAmount: 100,
                    accountsPostings: []
                }];

                rules = [{
                    ruleName: 'rule1',
                    ruleRank: 1,
                    targetType: 'Transaction',
                    ruleType: Rule.ruleTypes.user,
                    status: Rule.statuses.active,
                    ruleConditions: [{
                        ruleField: 'transactionNarrative',
                        ruleOperation: 'contains',
                        ruleCriteria: 'rrativ'
                    }],
                    ruleActions: [{
                        accountantNarrative: 'rule1_narrative',
                        accountsPostings: [{type: 'nominal', code: '0050'}]
                    }],
                    ruleCounts: { success: 0, fail: 1, applied: 0 }
                }];

                sandbox.stub(activity, 'log');
            });

            it('should do nothing if the are no transactions', () => {
                // arrange

                // act
                return engine.processRules([], rules, null, true)
                    .then(function (t) {

                        // assert
                        should(t).eql([]);

                        should(activity.log.callCount).eql(2);
                        should(activity.log.getCall(1).args).eql([
                            'info', {
                                bankAccountId: undefined,
                                function: 'processRules', msg: 'ended - nothing to process',
                                params: {
                                    entities: -1,
                                    rules: 1,
                                    transactions: 0
                                }
                            }
                        ]);
                    });
            });

            it('should process rules if there are no entities passed in', () => {
                return engine.processRules(transactions, rules, null, true)
                    .then((updated) => {
                        should(updated).eql(transactions);  // returns same collection object
                        updated[0].predictedActions[0].predictionId = '123';
                        updated[0].predictedActions[0].rules[0].ruleId = '123';

                        should(updated).match([{
                            transactionNarrative: 'narrative1',
                            transactionHash: '0f31e35e',
                            transactionAmount: 100,
                            accountsPostings: [{
                                createdBy: 'auto: rule1',
                                accountantNarrative: 'rule1_narrative',
                                grossAmount: 100,
                                netAmount: 100,
                                taxAmount: 0,
                                postingInstructions: [{
                                    type: 'nominal',
                                    code: '0050'
                                }]
                            }],
                            predictedActions: [{
                                action: {
                                    ruleAdditionalFields: [],
                                    accountsPostings: [{
                                        accountantNarrative: 'rule1_narrative',
                                        createdBy: 'auto: rule1',
                                        grossAmount: 100,
                                        netAmount: 100,
                                        postingInstructions: [{
                                            code: '0050',
                                            type: 'nominal',
                                            description: null,
                                            name: null,
                                            status: null,
                                            userDefinedTypeName: null,
                                            value: null
                                        }
                                        ],
                                        taxAmount: 0
                                    }
                                    ],
                                    reference: null,
                                    type: null
                                },
                                predictionId: '123',
                                rules: [{
                                    match: 'full',
                                    ruleId: '123',
                                    ruleRank: 1
                                }
                                ],
                                score: 100,
                                source: 'User'
                            }
                            ]
                        }]);
                    });
            });

            it('should do nothing if there is insufficient posting information on the rule (type)', () => {
                delete rules[0].ruleActions[0].accountsPostings[0].type;

                return engine.processRules(transactions, rules, entities, true)
                    .then(function (t) {
                        should(t).deepEqual(transactions);
                        should(t[0].accountsPostings).eql([]);
                    });
            });

            it('should do nothing if there is insufficient posting information on the rule(code)', () => {
                delete rules[0].ruleActions[0].accountsPostings[0].code;

                return engine.processRules(transactions, rules, entities, true)
                    .then(function (t) {
                        should(t).deepEqual(transactions);
                        should(t[0].accountsPostings).eql([]);
                    });
            });

            it('should process only rules that have entities on the rule', () => {

                rules[0].ruleConditions[0].ruleCriteria = 'narrative2';
                rules.push({
                    ruleName: 'rule2',
                    ruleRank: 2,
                    targetType: 'Transaction',
                    ruleType: Rule.ruleTypes.user,
                    status: Rule.statuses.active,
                    ruleConditions: [{
                        ruleField: 'transactionNarrative',
                        ruleOperation: 'contains',
                        ruleCriteria: 'rrativ'
                    }],
                    ruleActions: [{
                        accountantNarrative: 'rule2_narrative',
                        accountsPostings: [{type: 'nominal', code: '0050'}]
                    }]
                });

                return engine.processRules(transactions, rules, entities, true)
                    .then(function (t) {
                        should(t).eql(transactions);
                        should(t[0].accountsPostings).eql([{
                            createdBy: 'auto: rule2',
                            grossAmount: 100,
                            netAmount: 100,
                            taxAmount: 0,
                            accountantNarrative: 'rule2_narrative',
                            postingInstructions: [{
                                type: 'nominal',
                                code: '0050'
                            }]
                        }]);
                    })
            });

            it('should process subsequent rules if first rule has insufficient posting information on the rule(type)', () => {

                rules.push({
                    ruleName: 'rule2',
                    ruleRank: 2,
                    targetType: 'Transaction',
                    ruleType: Rule.ruleTypes.user,
                    status: Rule.statuses.active,
                    ruleConditions: [{
                        ruleField: 'transactionNarrative',
                        ruleOperation: 'contains',
                        ruleCriteria: 'rrativ'
                    }],
                    ruleActions: [{
                        accountantNarrative: 'rule2_narrative',
                        accountsPostings: [{type: 'nominal', code: '0050'}]
                    }],
                    entities: entities
                });

                rules[0].ruleConditions[0].ruleCriteria = 'rrativ';
                delete rules[0].ruleActions[0].accountsPostings[0].type;

                return engine.processRules(transactions, rules, null, true)
                    .then(function (updated) {
                        updated[0].predictedActions[0].predictionId = '123';
                        updated[0].predictedActions[0].rules[0].ruleId = '123';
                        should(updated).match(transactions);
                        should(updated).match([{
                            transactionNarrative: 'narrative1',
                            transactionHash: '0f31e35e',
                            transactionAmount: 100,
                            accountsPostings: [{
                                createdBy: 'auto: rule2',
                                accountantNarrative: 'rule2_narrative',
                                grossAmount: 100,
                                netAmount: 100,
                                taxAmount: 0,
                                postingInstructions: [{
                                    type: 'nominal',
                                    code: '0050',
                                }]
                            }],
                            predictedActions: [{
                                action: {
                                    ruleAdditionalFields: [],
                                    accountsPostings: [{
                                        accountantNarrative: 'rule2_narrative',
                                        createdBy: 'auto: rule2',
                                        grossAmount: 100,
                                        netAmount: 100,
                                        postingInstructions: [{
                                            code: '0050',
                                            type: 'nominal',
                                            description: null,
                                            name: null,
                                            status: null,
                                            userDefinedTypeName: null,
                                            value: null

                                        }],
                                        taxAmount: 0
                                    }],
                                    reference: null,
                                    type: null
                                },
                                predictionId: '123',
                                rules: [{
                                    match: 'full',
                                    ruleId: '123',
                                    ruleRank: 2
                                }],
                                score: 100,
                                source: 'User'
                            }],
                        }]);
                    })
            });

            it('should process subsequent rules if first rule has insufficient posting information on the rule(code)', () => {

                rules.push({
                    ruleName: 'rule2',
                    ruleRank: 2,
                    ruleType: Rule.ruleTypes.user,
                    targetType: 'Transaction',
                    status: Rule.statuses.active,
                    ruleConditions: [{
                        ruleField: 'transactionNarrative',
                        ruleOperation: 'contains',
                        ruleCriteria: 'rrativ'
                    }],
                    ruleActions: [{
                        accountantNarrative: 'rule2_narrative',
                        accountsPostings: [{type: 'nominal', code: '0050'}]
                    }],
                    entities: entities
                });

                rules[0].ruleConditions[0].ruleCriteria = 'rrativ';
                delete rules[0].ruleActions[0].accountsPostings[0].code;

                return engine.processRules(transactions, rules, null, true)
                    .then(function (updated) {
                        updated[0].predictedActions[0].predictionId = '123';
                        updated[0].predictedActions[0].rules[0].ruleId = '123';
                        should(updated).match(transactions);
                        should(updated).match([{
                            transactionNarrative: 'narrative1',
                            transactionHash: '0f31e35e',
                            transactionAmount: 100,
                            accountsPostings: [{
                                createdBy: 'auto: rule2',
                                accountantNarrative: 'rule2_narrative',
                                grossAmount: 100,
                                netAmount: 100,
                                taxAmount: 0,
                                postingInstructions: [{
                                    type: 'nominal',
                                    code: '0050',
                                }]
                            }],
                            predictedActions: [{
                                action: {
                                    ruleAdditionalFields: [],
                                    accountsPostings: [{
                                        accountantNarrative: 'rule2_narrative',
                                        createdBy: 'auto: rule2',
                                        grossAmount: 100,
                                        netAmount: 100,
                                        postingInstructions: [{
                                            code: '0050',
                                            type: 'nominal',
                                            description: null,
                                            name: null,
                                            status: null,
                                            userDefinedTypeName: null,
                                            value: null
                                        }],
                                        taxAmount: 0
                                    }],
                                    reference: null,
                                    type: null
                                },
                                predictionId: '123',
                                rules: [{
                                    match: 'full',
                                    ruleId: '123',
                                    ruleRank: 2
                                }],
                                score: 100,
                                source: 'User'
                            }]
                        }]);
                    });
            });

            it('should sort rules by rank before starting', () => {
                const rule2 = JSON.parse(JSON.stringify(rules[0]));
                rule2.ruleName = 'rule2';
                rule2.ruleActions[0].accountantNarrative = 'rule2_narrative';
                rule2.ruleRank = 1;

                rules.push(rule2);
                rules[0].ruleRank = 2;

                return engine.processRules(transactions, rules, null, true)
                    .then(function (updated) {
                        should(updated.length).eql(1);
                        should(updated[0].accountsPostings[0].accountantNarrative).eql('rule2_narrative');
                    })
            });
        });

        context('accountant', () => {

            beforeEach(() => {
                transactions = [{
                    transactionHash: '0f31e35e',
                    transactionNarrative: 'narrative1',
                    transactionAmount: 100,
                    accountsPostings: []
                }, {
                    transactionHash: '6668396f',
                    checkNum: '10221923',
                    transactionAmount: 200,
                    accountsPostings: []
                }];

                sandbox.stub(activity, 'log');
            });

            it('should do nothing if the are no transactions', function () {
                let rules = [{
                    ruleName: 'rule1',
                    targetType: 'Transaction',
                    status: Rule.statuses.active,
                    ruleType: Rule.ruleTypes.user,
                    ruleConditions: [{
                        ruleField: 'transactionNarrative',
                        ruleOperation: 'contains',
                        ruleCriteria: 'rrativ'
                    }],
                    ruleActions: [{
                        accountantNarrative: 'rule1_narrative',
                        accountsPostings: [{type: 'nominal', code: '0050'}]
                    }]
                }];

                return engine.processRules([], rules, entities)
                    .then(function (t) {
                        should(t).eql([]);

                        should(activity.log.callCount).eql(2);
                        should(activity.log.getCall(1).args).eql([
                            'info', {
                                bankAccountId: undefined,
                                function: 'processRules', msg: 'ended - nothing to process',
                                params: {
                                    entities: 5,
                                    rules: 1,
                                    transactions: 0
                                }
                            }
                        ]);
                    })
            });

            it('should do nothing if the are no entities', function () {
                let rules = [{
                    ruleName: 'rule1',
                    targetType: 'Transaction',
                    status: Rule.statuses.active,
                    ruleType: Rule.ruleTypes.user,
                    ruleConditions: [{
                        ruleField: 'transactionNarrative',
                        ruleOperation: 'contains',
                        ruleCriteria: 'rrativ'
                    }],
                    ruleActions: [{
                        accountantNarrative: 'rule1_narrative',
                        accountsPostings: [{type: 'nominal', code: '0050'}]
                    }]
                }];

                return engine.processRules(transactions, rules, [])
                    .then(function (t) {
                        should(t).eql(transactions);

                        should(activity.log.callCount).eql(2);
                        should(activity.log.getCall(1).args).eql([
                            'info', {
                                bankAccountId: undefined,
                                function: 'processRules', msg: 'ended - nothing to process',
                                params: {
                                    entities: 0,
                                    rules: 1,
                                    transactions: 2
                                }
                            }
                        ]);
                    })
            });

            it('should do nothing if the are no rules', function () {
                return engine.processRules(transactions, [], entities)
                    .then(function (t) {
                        should(t).eql(transactions);

                        should(activity.log.callCount).eql(2);
                        should(activity.log.getCall(1).args).eql([
                            'info', {
                                bankAccountId: undefined,
                                function: 'processRules', msg: 'ended - nothing to process',
                                params: {
                                    entities: 5,
                                    rules: 0,
                                    transactions: 2
                                }
                            }
                        ]);
                    })
            });

            it('should apply accountsPostings to multiple transactions', function () {
                let rules = [{
                    ruleName: 'rule1',
                    targetType: 'Transaction',
                    ruleType: Rule.ruleTypes.accountant,
                    status: Rule.statuses.active,
                    ruleConditions: [{
                        ruleField: 'transactionNarrative',
                        ruleOperation: 'contains',
                        ruleCriteria: 'rrativ'
                    }],
                    ruleActions: [{
                        accountantNarrative: 'rule1_narrative',
                        accountsPostings: [{type: 'nominal', code: '0050'}]
                    }],
                    ruleRank: null

                }, {
                    ruleName: 'rule2',
                    targetType: 'Transaction',
                    ruleType: Rule.ruleTypes.accountant,
                    status: Rule.statuses.active,
                    ruleConditions: [{
                        ruleField: 'checkNum',
                        ruleOperation: 'eq',
                        ruleCriteria: '102219??'
                    }],
                    ruleActions: [{
                        splitPercentage: 10,
                        accountantNarrative: 'rule2_split1_narrative',
                        accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
                    }, {
                        splitPercentage: 100,
                        accountantNarrative: 'rule2_split2_narrative',
                        accountsPostings: [{type: 'customer', code: 'CUST1'}]
                    }],
                    ruleRank: null
                }];

                return engine.processRules(transactions, rules, entities)
                    .then(function (updated) {
                        console.log('XXX UPDATED', updated);
                        updated[0].predictedActions[0].predictionId = '123';
                        updated[1].predictedActions[0].predictionId = '123';
                        updated[0].predictedActions[0].rules[0].ruleId = '123';
                        updated[1].predictedActions[0].rules[0].ruleId = '123';
                        should(updated).match(transactions);  // returns same collection object
                        should(updated).match([{
                            transactionNarrative: 'narrative1',
                            transactionHash: '0f31e35e',
                            transactionAmount: 100,
                            accountsPostings: [{
                                createdBy: 'auto: rule1',
                                accountantNarrative: 'rule1_narrative',
                                grossAmount: 100,
                                netAmount: 100,
                                taxAmount: 0,
                                postingInstructions: [{
                                    type: 'nominal',
                                    code: '0050',
                                    name: 'some_name',
                                    status: 'active'
                                }]
                            }],
                            predictedActions: [{
                                action: {
                                    ruleAdditionalFields: [],
                                    accountsPostings: [{
                                        accountantNarrative: 'rule1_narrative',
                                        createdBy: 'auto: rule1',
                                        grossAmount: 100,
                                        netAmount: 100,
                                        postingInstructions: [{
                                            code: '0050',
                                            name: 'some_name',
                                            status: 'active',
                                            type: 'nominal',
                                            description: null,
                                            userDefinedTypeName: null,
                                            value: null
                                        }],
                                        taxAmount: 0
                                    }],
                                    reference: null,
                                    type: null
                                },
                                predictionId: '123',
                                rules: [{
                                    match: 'full',
                                    ruleId: '123',
                                    ruleRank: null
                                }],
                                score: 100,
                                source: 'Accountant'
                            }]
                        }, {
                            checkNum: '10221923',
                            transactionHash: '6668396f',
                            transactionAmount: 200,
                            accountsPostings: [{
                                createdBy: 'auto: rule2',
                                accountantNarrative: 'rule2_split1_narrative',
                                grossAmount: 20,
                                netAmount: 20,
                                taxAmount: 0,
                                postingInstructions: [{
                                    type: 'supplier',
                                    code: 'SUPP1',
                                    name: 'supplier_1_ltd',
                                    status: 'active'
                                }]
                            }, {
                                createdBy: 'auto: rule2',
                                accountantNarrative: 'rule2_split2_narrative',
                                grossAmount: 180,
                                netAmount: 180,
                                taxAmount: 0,
                                postingInstructions: [{
                                    type: 'customer',
                                    code: 'CUST1',
                                    name: 'customer_1_ltd',
                                    status: 'on hold'
                                }]
                            }],
                            predictedActions: [{
                                action: {
                                    ruleAdditionalFields: [],
                                    accountsPostings: [{
                                        accountantNarrative: 'rule2_split1_narrative',
                                        createdBy: 'auto: rule2',
                                        grossAmount: 20,
                                        netAmount: 20,
                                        postingInstructions: [{
                                            code: 'SUPP1',
                                            name: 'supplier_1_ltd',
                                            status: 'active',
                                            type: 'supplier',
                                            description: null,
                                            userDefinedTypeName: null,
                                            value: null
                                        }],
                                        taxAmount: 0
                                    }, {
                                        accountantNarrative: 'rule2_split2_narrative',
                                        createdBy: 'auto: rule2',
                                        grossAmount: 180,
                                        netAmount: 180,
                                        postingInstructions: [{
                                            code: 'CUST1',
                                            name: 'customer_1_ltd',
                                            status: 'on hold',
                                            type: 'customer',
                                            description: null,
                                            userDefinedTypeName: null,
                                            value: null
                                        }],
                                        taxAmount: 0
                                    }],
                                    reference: null,
                                    type: null
                                },
                                predictionId: '123',
                                rules: [{
                                    match: 'full',
                                    ruleId: '123',
                                    ruleRank: null
                                }],
                                score: 100,
                                source: 'Accountant'
                            }]
                        }]);
                    })
            });

            it('should only apply the first matching rule', function () {
                transactions = [transactions[0]];

                let rules = [{
                    ruleName: 'rule1',
                    targetType: 'Transaction',
                    ruleType: Rule.ruleTypes.accountant,
                    status: Rule.statuses.active,
                    ruleConditions: [{
                        ruleField: 'transactionNarrative',
                        ruleOperation: 'contains',
                        ruleCriteria: 'rrativ'
                    }],
                    ruleActions: [{
                        accountantNarrative: 'rule1_narrative',
                        accountsPostings: [{type: 'nominal', code: '0050'}]
                    }],
                    ruleRank: null

                }, {
                    ruleName: 'rule1',
                    targetType: 'Transaction',
                    status: Rule.statuses.active,
                    ruleConditions: [{
                        ruleField: 'transactionNarrative',
                        ruleOperation: 'contains',
                        ruleCriteria: 'rrativ'
                    }],
                    ruleActions: [{
                        accountantNarrative: 'rule2_narrative',
                        accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
                    }]
                }];

                return engine.processRules(transactions, rules, entities)
                    .then(function (updated) {
                        updated[0].predictedActions[0].predictionId = '123';
                        updated[0].predictedActions[0].rules[0].ruleId = '123';
                        should(updated).match(transactions);  // returns same collection object
                        should(updated).match([{
                            transactionNarrative: 'narrative1',
                            transactionHash: '0f31e35e',
                            transactionAmount: 100,
                            accountsPostings: [{
                                createdBy: 'auto: rule1',
                                accountantNarrative: 'rule1_narrative',
                                grossAmount: 100,
                                netAmount: 100,
                                taxAmount: 0,
                                postingInstructions: [{
                                    type: 'nominal',
                                    code: '0050',
                                    name: 'some_name',
                                    status: 'active'
                                }]
                            }],
                            predictedActions: [{
                                action: {
                                    ruleAdditionalFields: [],
                                    accountsPostings: [{
                                        accountantNarrative: 'rule1_narrative',
                                        createdBy: 'auto: rule1',
                                        grossAmount: 100,
                                        netAmount: 100,
                                        postingInstructions: [{
                                            code: '0050',
                                            name: 'some_name',
                                            status: 'active',
                                            type: 'nominal',
                                            description: null,
                                            userDefinedTypeName: null,
                                            value: null,
                                        }],
                                        taxAmount: 0
                                    }],
                                    reference: null,
                                    type: null
                                },
                                predictionId: '123',
                                rules: [{
                                    match: 'full',
                                    ruleId: '123',
                                    ruleRank: null
                                }],
                                score: 100,
                                source: 'Accountant'
                            }]
                        }]);
                    })
            });

            it('should not modify the transactions if the rules did not match', function () {
                let rules = [{
                    ruleName: 'rule1',
                    targetType: 'Transaction',
                    status: Rule.statuses.active,
                    ruleConditions: [{
                        ruleField: 'transactionNarrative',
                        ruleOperation: 'eq',
                        ruleCriteria: 'invalid'
                    }],
                    ruleActions: [{
                        accountantNarrative: 'rule1_narrative',
                        accountsPostings: [{type: 'nominal', code: '0050'}]
                    }]
                }, {
                    ruleName: 'rule1',
                    targetType: 'Transaction',
                    status: Rule.statuses.active,
                    ruleConditions: [{
                        ruleField: 'checkNum',
                        ruleOperation: 'eq',
                        ruleCriteria: '11111111'
                    }],
                    ruleActions: [{
                        accountantNarrative: 'rule2_narrative',
                        accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
                    }]
                }];

                return engine.processRules(transactions, rules, entities)
                    .then(function (updated) {
                        should(updated).eql(transactions);  // returns same collection object
                        should(updated).eql([{
                            transactionNarrative: 'narrative1',
                            transactionAmount: 100,
                            transactionHash: '0f31e35e',
                            accountsPostings: []
                        }, {
                            checkNum: '10221923',
                            transactionAmount: 200,
                            transactionHash: '6668396f',
                            accountsPostings: []
                        }]);
                    })
            });

        });
    });


    describe('tryAttachPostings', function () {

        let transaction;

        beforeEach(function () {
            transaction = {transactionAmount: 100, accountsPostings: []};
        });

        it('should attach a single accountsPosting with a single posting instruction', function () {

            // we don't care about ruleConditions in these tests
            let rule = {
                ruleName: 'rule1',
                targetType: 'Transaction',
                status: Rule.statuses.active,
                ruleActions: [{
                    accountantNarrative: 'test narrative3-1',
                    accountsPostings: [{type: 'nominal', code: '0050'}]
                }]
            };

            should(engine.tryAttachPostings(transaction, rule, entities)).eql(true);
            should(transaction.accountsPostings).eql([{
                createdBy: 'auto: rule1',
                grossAmount: 100,
                netAmount: 100,
                taxAmount: 0,

                accountantNarrative: 'test narrative3-1',
                postingInstructions: [{
                    type: 'nominal',
                    code: '0050',
                    name: 'some_name',
                    status: 'active'
                }]
            }]);
        });

        it('should only include status if the entity has an entityStatus', function () {
            // we don't care about ruleConditions in these tests
            let rule = {
                ruleName: 'rule1',
                targetType: 'Transaction',
                status: Rule.statuses.active,
                ruleActions: [{
                    accountantNarrative: 'test narrative3-1',
                    accountsPostings: [{type: 'nominal', code: '0011'}]
                }]
            };

            should(engine.tryAttachPostings(transaction, rule, entities)).eql(true);
            should(transaction.accountsPostings).eql([{
                createdBy: 'auto: rule1',
                grossAmount: 100,
                netAmount: 100,
                taxAmount: 0,

                accountantNarrative: 'test narrative3-1',
                postingInstructions: [{
                    type: 'nominal',
                    code: '0011',
                    name: 'noStatus'
                }]
            }]);
        });

        it('should attach a single accountsPosting with multiple posting instruction', function () {
            // we don't care about ruleConditions in these tests
            let rule = {
                ruleName: 'rule1',
                targetType: 'Transaction',
                status: Rule.statuses.active,
                ruleActions: [{
                    accountantNarrative: 'test narrative3-1',
                    accountsPostings: [{type: 'nominal', code: '0050'}, {type: 'customer', code: 'CUST1'}]
                }]
            };

            should(engine.tryAttachPostings(transaction, rule, entities)).eql(true);
            should(transaction.accountsPostings).eql([{
                createdBy: 'auto: rule1',
                grossAmount: 100,
                netAmount: 100,
                taxAmount: 0,

                accountantNarrative: 'test narrative3-1',
                postingInstructions: [{
                    type: 'nominal',
                    code: '0050',
                    name: 'some_name',
                    status: 'active'
                }, {
                    type: 'customer',
                    code: 'CUST1',
                    name: 'customer_1_ltd',
                    status: 'on hold'
                }]
            }]);
        });

        it('should attach multiple accounts postings each with a single posting instruction', function () {
            // we don't care about ruleConditions in these tests
            let rule = {
                ruleName: 'rule1',
                targetType: 'Transaction',
                status: Rule.statuses.active,
                ruleActions: [{
                    splitPercentage: 10,
                    accountantNarrative: 'split1',
                    accountsPostings: [{type: 'nominal', code: '0050'}]
                }, {
                    splitPercentage: 100,
                    accountantNarrative: 'split2',
                    accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
                }]
            };

            should(engine.tryAttachPostings(transaction, rule, entities)).eql(true);
            should(transaction.accountsPostings).eql([{
                createdBy: 'auto: rule1',
                grossAmount: 10,
                netAmount: 10,
                taxAmount: 0,

                accountantNarrative: 'split1',
                postingInstructions: [{
                    type: 'nominal',
                    code: '0050',
                    name: 'some_name',
                    status: 'active'

                }]
            }, {
                createdBy: 'auto: rule1',
                grossAmount: 90,
                netAmount: 90,
                taxAmount: 0,

                accountantNarrative: 'split2',
                postingInstructions: [{
                    type: 'supplier',
                    code: 'SUPP1',
                    name: 'supplier_1_ltd',
                    status: 'active'
                }]
            }]);
        });

        it('should attach multiple posting instructions (incl tax)', function () {
            // we don't care about ruleConditions in these tests
            let rule = {
                ruleName: 'rule1',
                targetType: 'Transaction',
                status: Rule.statuses.active,
                ruleActions: [{
                    accountantNarrative: 'test narrative3-1',
                    accountsPostings: [
                        {type: 'supplier', code: 'SUPP1'},
                        {type: 'tax', code: 'T1'}
                    ]
                }]
            };

            sandbox.stub(engine.taxCalculator, 'calcTAX').returns({tax: 9.09, net: 90.91});

            transaction.transactionAmount = -transaction.transactionAmount;

            should(engine.tryAttachPostings(transaction, rule, entities)).eql(true);
            should(transaction.accountsPostings).eql([{
                createdBy: 'auto: rule1',
                grossAmount: -100,
                netAmount: -90.91,
                taxAmount: -9.09,

                accountantNarrative: 'test narrative3-1',
                postingInstructions: [{
                    type: 'supplier',
                    code: 'SUPP1',
                    name: 'supplier_1_ltd',
                    status: 'active'


                }, {
                    type: 'tax',
                    code: 'T1',
                    name: 'tax_1',
                    status: 'active',
                    value: 10
                }]
            }]);
        });

        it('should attach multiple posting instructions (incl tax) on a negative amount', function () {
            // we don't care about ruleConditions in these tests
            let rule = {
                ruleName: 'rule1',
                targetType: 'Transaction',
                status: Rule.statuses.active,
                ruleActions: [{
                    accountantNarrative: 'test narrative3-1',
                    accountsPostings: [
                        {type: 'supplier', code: 'SUPP1'},
                        {type: 'tax', code: 'T1'}
                    ]
                }]
            };

            sandbox.stub(engine.taxCalculator, 'calcTAX').returns({tax: 9.09, net: 90.91});

            should(engine.tryAttachPostings(transaction, rule, entities)).eql(true);
            should(transaction.accountsPostings).eql([{
                createdBy: 'auto: rule1',
                grossAmount: 100,
                netAmount: 90.91,
                taxAmount: 9.09,

                accountantNarrative: 'test narrative3-1',
                postingInstructions: [{
                    type: 'supplier',
                    code: 'SUPP1',
                    name: 'supplier_1_ltd',
                    status: 'active'
                }, {
                    type: 'tax',
                    code: 'T1',
                    name: 'tax_1',
                    status: 'active',
                    value: 10
                }]
            }]);
        });

        it('should not add a posting if the split evaluated to zero', function () {
            transaction.transactionAmount = 0.02;
            // we don't care about ruleConditions in these tests
            let rule = {
                ruleName: 'rule1',
                targetType: 'Transaction',
                status: Rule.statuses.active,
                ruleActions: [{
                    splitPercentage: 10,
                    accountantNarrative: 'split1',
                    accountsPostings: [{type: 'nominal', code: '0050'}]
                }, {
                    splitPercentage: 100,
                    accountantNarrative: 'split2',
                    accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
                }]
            };

            should(engine.tryAttachPostings(transaction, rule, entities)).eql(true);
            should(transaction.accountsPostings).eql([{
                createdBy: 'auto: rule1',
                grossAmount: 0.02,
                netAmount: 0.02,
                taxAmount: 0,

                accountantNarrative: 'split2',
                postingInstructions: [{
                    type: 'supplier',
                    code: 'SUPP1',
                    name: 'supplier_1_ltd',
                    status: 'active'
                }]
            }]);
        });

        it('should throw an error if the rule is not of type Transaction', function (done) {
            try {
                // we don't care about ruleConditions in these tests
                let rule = {
                    ruleName: 'rule1',
                    targetType: 'Invalid',
                    status: Rule.statuses.active,
                    ruleActions: [{
                        accountantNarrative: 'test narrative3-1',
                        accountsPostings: [{type: 'nominal', code: '0050'}]
                    }]
                };

                engine.tryAttachPostings(transaction, rule, entities);

                done(new Error('should have thrown'));

            } catch (err) {
                should(err.message).eql('invalid rule or targetType');
                should(transaction.accountsPostings).eql([]);
                done();
            }
        });

        it('should throw an error if the rule is inactive', function (done) {
            try {
                // we don't care about ruleConditions in these tests
                let rule = {
                    ruleName: 'rule1',
                    targetType: 'Transaction',
                    status: Rule.statuses.inactive,
                    ruleActions: [{
                        accountantNarrative: 'test narrative3-1',
                        accountsPostings: [{type: 'nominal', code: '0050'}]
                    }]
                };

                engine.tryAttachPostings(transaction, rule, entities);

                done(new Error('should have thrown'));

            } catch (err) {
                should(err.message).eql('rule is not active');
                should(transaction.accountsPostings).eql([]);
                done();
            }
        });

        it('should throw an error and not modify the transaction if no matching entity exists', function (done) {
            try {
                // we don't care about ruleConditions in these tests
                let rule = {
                    ruleName: 'rule1',
                    targetType: 'Transaction',
                    status: Rule.statuses.active,
                    ruleActions: [{
                        accountantNarrative: 'test narrative3-1',
                        accountsPostings: [{type: 'nominal', code: '1050'}]
                    }]
                };

                engine.tryAttachPostings(transaction, rule, entities);

                done(new Error('should have thrown'));

            } catch (err) {
                should(transaction.accountsPostings).eql([]);
                done();
            }
        });

        it('should throw an error and not modify the transaction if the remainder is below 0.01 before processing a splitPercentage that is not the last line', function (done) {
            try {
                transaction.transactionAmount = 0.01;
                // we don't care about ruleConditions in these tests
                let rule = {
                    ruleName: 'rule1',
                    targetType: 'Transaction',
                    status: Rule.statuses.active,
                    ruleActions: [{
                        splitPercentage: 99,                                    // will eql 0.01 after rounding up
                        accountantNarrative: 'split1',
                        accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
                    }, {
                        splitPercentage: 50,                                    // should cause the rule to fail
                        accountantNarrative: 'split2',
                        accountsPostings: [{type: 'customer', code: 'CUST1'}]
                    }, {
                        splitPercentage: 100,
                        accountantNarrative: 'split2',
                        accountsPostings: [{type: 'customer', code: 'CUST1'}]
                    }]
                };

                engine.tryAttachPostings(transaction, rule, entities);

                done(new Error('should have thrown'));

            } catch (err) {
                should(err.message).eql('invalid remainder on split: 0');
                should(transaction.accountsPostings).eql([]);
                done();
            }
        });

        it('should throw an error and not modify the transaction if the final split is an absolute and does not equal the remainder', function (done) {
            try {
                transaction.transactionAmount = 100;
                // we don't care about ruleConditions in these tests
                let rule = {
                    ruleName: 'rule1',
                    targetType: 'Transaction',
                    status: Rule.statuses.active,
                    ruleActions: [{
                        splitPercentage: 99,                                    // will eql 99.00
                        accountantNarrative: 'split1',
                        accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
                    }, {
                        splitAmount: 10,                                    // should cause the rule to fail
                        accountantNarrative: 'split2',
                        accountsPostings: [{type: 'customer', code: 'CUST1'}]
                    }]
                };

                engine.tryAttachPostings(transaction, rule, entities);

                done(new Error('should have thrown'));

            } catch (err) {
                should(err.message).eql('invalid absolute amount on last split: 1');
                should(transaction.accountsPostings).eql([]);
                done();
            }
        });

        // NOTE: this rule shouldn't even validate, but belt and braces
        it('should throw an error and not modify the transaction if the final split is a percentage and does not equal 100', function (done) {
            try {
                transaction.transactionAmount = 100;
                // we don't care about ruleConditions in these tests
                let rule = {
                    ruleName: 'rule1',
                    targetType: 'Transaction',
                    status: Rule.statuses.active,
                    ruleActions: [{
                        splitPercentage: 99,                                    // will eql 99.00
                        accountantNarrative: 'split1',
                        accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
                    }, {
                        splitPercentage: 10,                                    // should cause the rule to fail, not 100%
                        accountantNarrative: 'split2',
                        accountsPostings: [{type: 'customer', code: 'CUST1'}]
                    }]
                };

                engine.tryAttachPostings(transaction, rule, entities);

                done(new Error('should have thrown'));

            } catch (err) {
                should(err.message).eql('invalid split percentage: 10');
                should(transaction.accountsPostings).eql([]);
                done();
            }
        });

        it('should round values with a decimal >= .5 up', function (done) {
            try {
                transaction.transactionAmount = 2.83;
                // we don't care about ruleConditions in these tests
                let rule = {
                    ruleName: 'rule1',
                    targetType: 'Transaction',
                    status: Rule.statuses.active,
                    ruleActions: [{
                        splitPercentage: 17.5,                                    // will eql 0.49525 and round to 0.50
                        accountantNarrative: 'split1',
                        accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
                    }, {
                        splitPercentage: 100,                                    // should cause the rule to fail, not 100%
                        accountantNarrative: 'split2',
                        accountsPostings: [{type: 'customer', code: 'CUST1'}]
                    }]
                };

                should(engine.tryAttachPostings(transaction, rule, entities)).eql(true);
                should(transaction.accountsPostings).eql([{
                    createdBy: 'auto: rule1',
                    grossAmount: 0.5,
                    netAmount: 0.5,
                    taxAmount: 0,

                    accountantNarrative: 'split1',
                    postingInstructions: [{
                        type: 'supplier',
                        code: 'SUPP1',
                        name: 'supplier_1_ltd',
                        status: 'active'
                    }]
                }, {
                    createdBy: 'auto: rule1',
                    grossAmount: 2.33,
                    netAmount: 2.33,
                    taxAmount: 0,

                    accountantNarrative: 'split2',
                    postingInstructions: [{
                        type: 'customer',
                        code: 'CUST1',
                        name: 'customer_1_ltd',
                        status: 'on hold'
                    }]
                }]);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should round values with a decimal < .5 down', function (done) {
            try {
                transaction.transactionAmount = 2.83;
                // we don't care about ruleConditions in these tests
                let rule = {
                    ruleName: 'rule1',
                    targetType: 'Transaction',
                    status: Rule.statuses.active,
                    ruleActions: [{
                        splitPercentage: 17,                                    // will eql 0.4811 and round to 0.48
                        accountantNarrative: 'split1',
                        accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
                    }, {
                        splitPercentage: 100,                                    // should cause the rule to fail, not 100%
                        accountantNarrative: 'split2',
                        accountsPostings: [{type: 'customer', code: 'CUST1'}]
                    }]
                };

                should(engine.tryAttachPostings(transaction, rule, entities)).eql(true);
                should(transaction.accountsPostings).eql([{
                    createdBy: 'auto: rule1',
                    grossAmount: 0.48,
                    netAmount: 0.48,
                    taxAmount: 0,

                    accountantNarrative: 'split1',
                    postingInstructions: [{
                        type: 'supplier',
                        code: 'SUPP1',
                        name: 'supplier_1_ltd',
                        status: 'active'
                    }]
                }, {
                    createdBy: 'auto: rule1',
                    grossAmount: 2.35,
                    netAmount: 2.35,
                    taxAmount: 0,

                    accountantNarrative: 'split2',
                    postingInstructions: [{
                        type: 'customer',
                        code: 'CUST1',
                        name: 'customer_1_ltd',
                        status: 'on hold'
                    }]
                }]);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('calculateSplit', function () {
        it('should default to 100% split if there is no splitAmount or splitPercentage', function (done) {
            let ruleAction = {
                accountantNarrative: 'split1',
                accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
            };

            let bRemainder = new Big(1);

            try {
                should(engine.calculateSplit(ruleAction, bRemainder)).eql({
                    bAmount: new Big(1),
                    bRemainder: new Big(0)
                });
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should throw an error if bRemainder is less than 0.01', function (done) {
            let ruleAction = {
                accountantNarrative: 'split1',
                accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
            };

            let bRemainder = new Big(0.001);

            try {
                engine.calculateSplit(ruleAction, bRemainder);
                done(new Error('should have thrown'));
            } catch (err) {
                should(err).eql(new Error('invalid remainder on split: 0.001'));
                done();
            }
        });

        it('should throw an error if this is the last action and it has a splitPercentage less than 100', function (done) {
            let ruleAction = {
                splitPercentage: 10,
                accountantNarrative: 'split1',
                accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
            };

            let bRemainder = new Big(10);

            try {
                engine.calculateSplit(ruleAction, bRemainder, true);
                done(new Error('should have thrown'));
            } catch (err) {
                should(err).eql(new Error('invalid split percentage: 10'));
                done();
            }
        });

        it('should throw an error if this is the last action and it has a splitPercentage greater than 100', function (done) {
            let ruleAction = {
                splitPercentage: 110,
                accountantNarrative: 'split1',
                accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
            };

            let bRemainder = new Big(10);

            try {
                engine.calculateSplit(ruleAction, bRemainder, true);
                done(new Error('should have thrown'));
            } catch (err) {
                should(err).eql(new Error('invalid split percentage: 110'));
                done();
            }
        });

        it('should calculate the amount and remainder on splitPercentage', function (done) {
            let ruleAction = {
                splitPercentage: 10,
                accountantNarrative: 'split1',
                accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
            };

            let bRemainder = new Big(100);

            try {
                should(engine.calculateSplit(ruleAction, bRemainder)).eql({
                    bAmount: new Big(10),
                    bRemainder: new Big(90)
                });
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should round values below .5 down on splitPercentage', function (done) {
            let ruleAction = {
                splitPercentage: 17.4,
                accountantNarrative: 'split1',
                accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
            };

            let bRemainder = new Big(21);

            try {
                should(engine.calculateSplit(ruleAction, bRemainder)).eql({
                    bAmount: new Big(3.65),
                    bRemainder: new Big(17.35)
                });
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should round values above .5 up on splitPercentage', function (done) {
            let ruleAction = {
                splitPercentage: 17.6,
                accountantNarrative: 'split1',
                accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
            };

            let bRemainder = new Big(21);

            try {
                should(engine.calculateSplit(ruleAction, bRemainder)).eql({
                    bAmount: new Big(3.70),
                    bRemainder: new Big(17.30)
                });
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should round values equal to .5 up on splitPercentage', function (done) {
            let ruleAction = {
                splitPercentage: 17.5,
                accountantNarrative: 'split1',
                accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
            };

            let bRemainder = new Big(21);

            try {
                should(engine.calculateSplit(ruleAction, bRemainder)).eql({
                    bAmount: new Big(3.68),
                    bRemainder: new Big(17.32)
                });
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should throw an error if the splitAmount is less than the remainder', function (done) {
            let ruleAction = {
                splitAmount: 15,
                accountantNarrative: 'split1',
                accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
            };

            let bRemainder = new Big(10);

            try {
                engine.calculateSplit(ruleAction, bRemainder);
                done(new Error('should have thrown'));
            } catch (err) {
                should(err).eql(new Error('invalid absolute amount on split: 10'));
                done();
            }
        });

        it('should throw an error if this is the last action and it has a splitAmount less than the remainder', function (done) {
            let ruleAction = {
                splitAmount: 15,
                accountantNarrative: 'split1',
                accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
            };

            let bRemainder = new Big(10);

            try {
                engine.calculateSplit(ruleAction, bRemainder, true);
                done(new Error('should have thrown'));
            } catch (err) {
                should(err).eql(new Error('invalid absolute amount on last split: 10'));
                done();
            }
        });

        it('should throw an error if this is the last action and it has a splitAmount greater than the remainder', function (done) {
            let ruleAction = {
                splitAmount: 15,
                accountantNarrative: 'split1',
                accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
            };

            let bRemainder = new Big(100);

            try {
                engine.calculateSplit(ruleAction, bRemainder, true);
                done(new Error('should have thrown'));
            } catch (err) {
                should(err).eql(new Error('invalid absolute amount on last split: 100'));
                done();
            }
        });

        it('should return negative amount and remainder if the initial remainder is negative on splitPercentrage', function (done) {
            let ruleAction = {
                splitPercentage: 10,
                accountantNarrative: 'split1',
                accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
            };

            let bRemainder = new Big(-100);

            try {
                should(engine.calculateSplit(ruleAction, bRemainder)).eql({
                    bAmount: new Big(-10),
                    bRemainder: new Big(-90)
                });
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should return negative amount and remainder if the initial remainder is negative on splitAmount', function (done) {
            let ruleAction = {
                splitAmount: 10,
                accountantNarrative: 'split1',
                accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
            };

            let bRemainder = new Big(-100);

            try {
                should(engine.calculateSplit(ruleAction, bRemainder)).eql({
                    bAmount: new Big(-10),
                    bRemainder: new Big(-90)
                });
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should calculate the amount and remainder on splitAmount', function (done) {
            let ruleAction = {
                splitAmount: 10,
                accountantNarrative: 'split1',
                accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
            };

            let bRemainder = new Big(100);

            try {
                should(engine.calculateSplit(ruleAction, bRemainder)).eql({
                    bAmount: new Big(10),
                    bRemainder: new Big(90)
                });
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should calculate the amount and remainder on splitAmount when using a long split percentage', function (done) {
            let ruleAction = {
                splitPercentage: 10.0000000000001,
                accountantNarrative: 'split1',
                accountsPostings: [{type: 'supplier', code: 'SUPP1'}]
            };

            let bRemainder = new Big(100);

            try {
                should(engine.calculateSplit(ruleAction, bRemainder)).eql({
                    bAmount: new Big(10),
                    bRemainder: new Big(90)
                });
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('isMatch', function () {
        describe('numeric fields', function () {
            it('should match on a single numeric field eq', function (done) {
                try {
                    let transaction = {transactionAmount: 100};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionAmount',
                            ruleOperation: 'eq',
                            ruleCriteria: 100
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single negative numeric field eq', function (done) {
                try {
                    let transaction = {transactionAmount: -100};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionAmount',
                            ruleOperation: 'eq',
                            ruleCriteria: 100
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single numeric field lt', function (done) {
                try {
                    let transaction = {transactionAmount: 50};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionAmount',
                            ruleOperation: 'lt',
                            ruleCriteria: 100
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single negative numeric field lt', function (done) {
                try {
                    let transaction = {transactionAmount: -50};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionAmount',
                            ruleOperation: 'lt',
                            ruleCriteria: 100
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single numeric field gt', function (done) {
                try {
                    let transaction = {transactionAmount: 100};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionAmount',
                            ruleOperation: 'gt',
                            ruleCriteria: 99
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single negative numeric field gt', function (done) {
                try {
                    let transaction = {transactionAmount: -100};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionAmount',
                            ruleOperation: 'gt',
                            ruleCriteria: 99
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single numeric field lte', function (done) {
                try {
                    let transaction = {transactionAmount: 100};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionAmount',
                            ruleOperation: 'le',
                            ruleCriteria: 100
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single negative numeric field lte', function (done) {
                try {
                    let transaction = {transactionAmount: -100};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionAmount',
                            ruleOperation: 'le',
                            ruleCriteria: 100
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single numeric field gte', function (done) {
                try {
                    let transaction = {transactionAmount: 100};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionAmount',
                            ruleOperation: 'ge',
                            ruleCriteria: 100
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single negative numeric field gte', function (done) {
                try {
                    let transaction = {transactionAmount: -100};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionAmount',
                            ruleOperation: 'ge',
                            ruleCriteria: 100
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on multiple numeric field', function (done) {
                try {
                    let transaction = {transactionAmount: 100};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionAmount',
                            ruleOperation: 'eq',
                            ruleCriteria: 100
                        }, {
                            ruleField: 'transactionAmount',
                            ruleOperation: 'lt',
                            ruleCriteria: 101
                        }, {
                            ruleField: 'transactionAmount',
                            ruleOperation: 'gt',
                            ruleCriteria: 99
                        }, {
                            ruleField: 'transactionAmount',
                            ruleOperation: 'le',
                            ruleCriteria: 100
                        }, {
                            ruleField: 'transactionAmount',
                            ruleOperation: 'ge',
                            ruleCriteria: 100
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on multiple negative numeric field', function (done) {
                try {
                    let transaction = {transactionAmount: -100};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionAmount',
                            ruleOperation: 'eq',
                            ruleCriteria: 100
                        }, {
                            ruleField: 'transactionAmount',
                            ruleOperation: 'lt',
                            ruleCriteria: 101
                        }, {
                            ruleField: 'transactionAmount',
                            ruleOperation: 'gt',
                            ruleCriteria: 99
                        }, {
                            ruleField: 'transactionAmount',
                            ruleOperation: 'le',
                            ruleCriteria: 100
                        }, {
                            ruleField: 'transactionAmount',
                            ruleOperation: 'ge',
                            ruleCriteria: 100
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match when given multiple identical conditions', function (done) {
                try {
                    let transaction = {transactionAmount: 100};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionAmount',
                            ruleOperation: 'eq',
                            ruleCriteria: 100
                        }, {
                            ruleField: 'transactionAmount',
                            ruleOperation: 'eq',
                            ruleCriteria: 100
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should not match if the first condition fails', function (done) {
                try {
                    let transaction = {transactionAmount: 100};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionAmount',
                            ruleOperation: 'eq',
                            ruleCriteria: 99
                        }, {
                            ruleField: 'transactionAmount',
                            ruleOperation: 'eq',
                            ruleCriteria: 100
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(false);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should not match if the second condition fails', function (done) {
                try {
                    let transaction = {transactionAmount: 100};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionAmount',
                            ruleOperation: 'eq',
                            ruleCriteria: 100
                        }, {
                            ruleField: 'transactionAmount',
                            ruleOperation: 'eq',
                            ruleCriteria: 99
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(false);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            })

        });

        describe('date fields', function () {
            it('should match on a single date field eq', function (done) {
                try {
                    let transaction = {datePosted: new Date('2017-06-21')};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'datePosted',
                            ruleOperation: 'eq',
                            ruleCriteria: 21
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single date field lt', function (done) {
                try {
                    let transaction = {datePosted: new Date('2017-06-21')};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'datePosted',
                            ruleOperation: 'lt',
                            ruleCriteria: 22
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single date field gt', function (done) {
                try {
                    let transaction = {datePosted: new Date('2017-06-21')};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'datePosted',
                            ruleOperation: 'gt',
                            ruleCriteria: 20
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single date field lte', function (done) {
                try {
                    let transaction = {datePosted: new Date('2017-06-21')};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'datePosted',
                            ruleOperation: 'le',
                            ruleCriteria: 21
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single date field gte', function (done) {
                try {
                    let transaction = {datePosted: new Date('2017-06-21')};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'datePosted',
                            ruleOperation: 'ge',
                            ruleCriteria: 21
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on multiple date field', function (done) {
                try {
                    let transaction = {datePosted: new Date('2017-06-21')};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'datePosted',
                            ruleOperation: 'eq',
                            ruleCriteria: 21
                        }, {
                            ruleField: 'datePosted',
                            ruleOperation: 'lt',
                            ruleCriteria: 22
                        }, {
                            ruleField: 'datePosted',
                            ruleOperation: 'gt',
                            ruleCriteria: 20
                        }, {
                            ruleField: 'datePosted',
                            ruleOperation: 'le',
                            ruleCriteria: 21
                        }, {
                            ruleField: 'datePosted',
                            ruleOperation: 'ge',
                            ruleCriteria: 21
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match when given multiple identical conditions', function (done) {
                try {
                    let transaction = {datePosted: new Date('2017-06-21')};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'datePosted',
                            ruleOperation: 'eq',
                            ruleCriteria: 21
                        }, {
                            ruleField: 'datePosted',
                            ruleOperation: 'eq',
                            ruleCriteria: 21
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should not match if the first condition fails', function (done) {
                try {
                    let transaction = {datePosted: new Date('2017-06-21')};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'datePosted',
                            ruleOperation: 'eq',
                            ruleCriteria: 20
                        }, {
                            ruleField: 'datePosted',
                            ruleOperation: 'eq',
                            ruleCriteria: 21
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(false);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should not match if the second condition fails', function (done) {
                try {
                    let transaction = {datePosted: new Date('2017-06-21')};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'datePosted',
                            ruleOperation: 'eq',
                            ruleCriteria: 21
                        }, {
                            ruleField: 'datePosted',
                            ruleOperation: 'eq',
                            ruleCriteria: 20
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(false);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            })
        });

        describe('string fields', function () {
            it('should match on a single string field eq', function (done) {
                try {
                    let transaction = {transactionNarrative: '$$$PAY FUEL BP$$$'};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionNarrative',
                            ruleOperation: 'eq',
                            ruleCriteria: '$$$PAY FUEL BP$$$'
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single string field with wildcards eq', function (done) {
                try {
                    let transaction = {transactionNarrative: '$$$PAY FUEL BP$$$'};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionNarrative',
                            ruleOperation: 'eq',
                            ruleCriteria: '*BP*'
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single string field contains', function (done) {
                try {
                    let transaction = {transactionNarrative: '$$$PAY FUEL BP$$$'};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionNarrative',
                            ruleOperation: 'contains',
                            ruleCriteria: 'FUEL'
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single string field with wildcards contains', function (done) {
                try {
                    let transaction = {transactionNarrative: '$$$PAY FUEL BP$$$'};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionNarrative',
                            ruleOperation: 'contains',
                            ruleCriteria: 'F???'
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single string field notcontains', function (done) {
                try {
                    let transaction = {transactionNarrative: '$$$PAY FUEL BP$$$'};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionNarrative',
                            ruleOperation: 'noncontains',
                            ruleCriteria: 'RENT'
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on a single string field with wildcards notcontains', function (done) {
                try {
                    let transaction = {transactionNarrative: '$$$PAY FUEL BP$$$'};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionNarrative',
                            ruleOperation: 'noncontains',
                            ruleCriteria: 'REN*'
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match on multiple string field', function (done) {
                try {
                    let transaction = {transactionNarrative: '$$$PAY FUEL BP$$$'};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionNarrative',
                            ruleOperation: 'eq',
                            ruleCriteria: '*FUEL*'
                        }, {
                            ruleField: 'transactionNarrative',
                            ruleOperation: 'contains',
                            ruleCriteria: '?UEL*'
                        }, {
                            ruleField: 'transactionNarrative',
                            ruleOperation: 'notcontains',
                            ruleCriteria: 'RENT'
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should match when given multiple identical conditions', function (done) {
                try {
                    let transaction = {transactionNarrative: '$$$PAY FUEL BP$$$'};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionNarrative',
                            ruleOperation: 'eq',
                            ruleCriteria: '$$$PAY FUEL BP$$$'
                        }, {
                            ruleField: 'transactionNarrative',
                            ruleOperation: 'eq',
                            ruleCriteria: '$$$PAY FUEL BP$$$'
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(true);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should not match if the first condition fails', function (done) {
                try {
                    let transaction = {transactionNarrative: '$$$PAY FUEL BP$$$'};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionNarrative',
                            ruleOperation: 'eq',
                            ruleCriteria: '$$$PAY RENT BP$$$'
                        }, {
                            ruleField: 'transactionNarrative',
                            ruleOperation: 'eq',
                            ruleCriteria: '$$$PAY FUEL BP$$$'
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(false);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should not match if the second condition fails', function (done) {
                try {
                    let transaction = {transactionNarrative: '$$$PAY FUEL BP$$$'};
                    let rule = {
                        ruleConditions: [{
                            ruleField: 'transactionNarrative',
                            ruleOperation: 'eq',
                            ruleCriteria: '$$$PAY FUEL BP$$$'
                        }, {
                            ruleField: 'transactionNarrative',
                            ruleOperation: 'eq',
                            ruleCriteria: '$$$PAY RENT BP$$$'
                        }]
                    };

                    should(engine.isMatch(transaction, rule, {}, {})).eql(false);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            })
        });
    });

    describe('getCheckFunc', function () {
        it('should retrieve the checkNumberField function for a number', function (done) {
            try {
                let field = 9;
                should(engine.getCheckFunc(field)).be.a.Function();

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should retrieve the checkDateField function for a date', function (done) {
            try {
                let field = new Date();
                should(engine.getCheckFunc(field)).be.a.Function();

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should retrieve the checkStringField function for a string', function (done) {
            try {
                let field = 'some_string';
                should(engine.getCheckFunc(field)).be.a.Function();

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should return undefined for an object', function (done) {
            try {
                let field = {};
                should(engine.getCheckFunc(field)).eql(undefined);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should return undefined for an array', function (done) {
            try {
                let field = [];
                should(engine.getCheckFunc(field)).eql(undefined);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should return undefined for undefined', function (done) {
            try {
                let field = undefined;
                should(engine.getCheckFunc(field)).eql(undefined);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should return undefined for null', function (done) {
            try {
                let field = null;
                should(engine.getCheckFunc(field)).eql(undefined);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('checkStringField', function () {
        let checkStringField;
        
        beforeEach(() => {
            checkStringField = engine.getCheckFunc('string_field');
        });
        
        it('should correctly check eq', function (done) {
            try {
                should(checkStringField('some string', 'some string', Rule.operations.eq)).eql(true);
                should(checkStringField('so.me st.ri.ng', 'so.me st.ri.ng', Rule.operations.eq)).eql(true);
                should(checkStringField('random words', 'random w?rds', Rule.operations.eq)).eql(true);
                should(checkStringField('random wards', 'random w?rds', Rule.operations.eq)).eql(true);
                should(checkStringField('random w|rds', 'random w?rds', Rule.operations.eq)).eql(true);
                should(checkStringField('random w?rds', 'random w?rds', Rule.operations.eq)).eql(true);
                should(checkStringField('testing *', 'testing *', Rule.operations.eq)).eql(true);
                should(checkStringField('testing ***', 'testing *', Rule.operations.eq)).eql(true);
                should(checkStringField('testing a', 'testing *', Rule.operations.eq)).eql(true);
                should(checkStringField('testing 1', 'testing *', Rule.operations.eq)).eql(true);
                should(checkStringField('testing a random string', 'testing *', Rule.operations.eq)).eql(true);
                should(checkStringField('testing the middle of the string', '*middle*', Rule.operations.eq)).eql(true);
                should(checkStringField('$$$testing the middle of the string$$$', '$$$*middle*$$$', Rule.operations.eq)).eql(true);

                should(checkStringField('Xsome string', 'some string', Rule.operations.eq)).eql(false);
                should(checkStringField('some stringX', 'some string', Rule.operations.eq)).eql(false);
                should(checkStringField('Xsome stringX', 'some string', Rule.operations.eq)).eql(false);
                should(checkStringField('some-string', 'some string', Rule.operations.eq)).eql(false);
                should(checkStringField('so-me st-ri-ng', 'so.me st.ri.ng', Rule.operations.eq)).eql(false);
                should(checkStringField('random woords', 'random w?rds', Rule.operations.eq)).eql(false);
                should(checkStringField('random w?ards', 'random w?rds', Rule.operations.eq)).eql(false);
                should(checkStringField('random w|rd', 'random w?rds', Rule.operations.eq)).eql(false);
                should(checkStringField('random ?rds', 'random w?rds', Rule.operations.eq)).eql(false);
                should(checkStringField('not testing *', 'testing *', Rule.operations.eq)).eql(false);
                should(checkStringField('testingfail a', 'testing *', Rule.operations.eq)).eql(false);
                should(checkStringField('testing the midXdle of the string', '*middle*', Rule.operations.eq)).eql(false);
                should(checkStringField('$$$testing the midXdle of the string$$$', '$$$*middle*$$$', Rule.operations.eq)).eql(false);
                should(checkStringField('testing the middle of the string', '$$$*middle*$$$', Rule.operations.eq)).eql(false);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should correctly check containsWords', function (done) {
            try {
                should(checkStringField('somestring', '*somestring*', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test (with brackets) and', '(with', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test (with brackets) and', 'test (with', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test (with brackets) and', 'with brackets)', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test (with brackets) and', 'with brackets) and', Rule.operations.containsWords)).eql(true);

                should(checkStringField('test with-hyphen and', 'with-', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test with-hyphen and', '-hyphen', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test with-hyphen and', 'with-hyphen', Rule.operations.containsWords)).eql(true);

                should(checkStringField('test ((with brackets)) and', '((with', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test ((with brackets)) and', 'test ((with', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test ((with brackets)) and', 'with brackets))', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test ((with brackets)) and', 'with brackets)) and', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test ((with brackets)) and', '((with brackets)) and', Rule.operations.containsWords)).eql(true);

                should(checkStringField('test ((((with brackets)))) and', '(((with', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test ((((with brackets)))) and', 'test ((((with', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test ((((with brackets)))) and', 'with brackets))))', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test ((((with brackets)))) and', 'with brackets)))) and', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test ((((with brackets)))) and', '((((with brackets)))) and', Rule.operations.containsWords)).eql(true);

                should(checkStringField('test [[with brackets]] and', 'test [[with', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test [[with brackets]] and', 'with brackets]]', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test [[with brackets]] and', 'with brackets]] and', Rule.operations.containsWords)).eql(true);
                should(checkStringField('test [[with brackets]] and', '[[with brackets]] and', Rule.operations.containsWords)).eql(true);

                should(checkStringField('some string', 'some string', Rule.operations.containsWords)).eql(true);
                should(checkStringField('so.me st.ri.ng', 'so.me st.ri.ng', Rule.operations.containsWords)).eql(true);
                should(checkStringField('random words', 'random w?rds', Rule.operations.containsWords)).eql(true);
                should(checkStringField('random w|rds', 'random w?rds', Rule.operations.containsWords)).eql(true);
                should(checkStringField('random w?rds', 'random w?rds', Rule.operations.containsWords)).eql(true);
                should(checkStringField('testing *', 'testing *', Rule.operations.containsWords)).eql(false);
                should(checkStringField('testing ***', 'testing *', Rule.operations.containsWords)).eql(false);
                should(checkStringField('testing a', 'testing *', Rule.operations.containsWords)).eql(true);
                should(checkStringField('testing 1', 'testing *', Rule.operations.containsWords)).eql(true);

                should(checkStringField('testing a random string', 'testing a', Rule.operations.containsWords)).eql(true);
                should(checkStringField('testing a random string', 'a random', Rule.operations.containsWords)).eql(true);
                should(checkStringField('testing a random string', 'random string', Rule.operations.containsWords)).eql(true);
                should(checkStringField('testing a random string', 'testing *', Rule.operations.containsWords)).eql(true);
                should(checkStringField('testing a random string', 'testing random', Rule.operations.containsWords)).eql(false);
                should(checkStringField('testing the middle of the string', '*middle*', Rule.operations.containsWords)).eql(true);
                should(checkStringField('ABCDEF1234567890$$$testing the middle of the string$$$ABCDEF1234567890', '$$$*middle*$$$', Rule.operations.containsWords)).eql(true);

                should(checkStringField('Xsome string', 'some string', Rule.operations.containsWords)).eql(false);
                should(checkStringField('some stringX', 'some string', Rule.operations.containsWords)).eql(false);
                should(checkStringField('Xsome stringX', 'some string', Rule.operations.containsWords)).eql(false);
                should(checkStringField('in the some string middle', 'some string', Rule.operations.containsWords)).eql(true);
                should(checkStringField('anything before some string', '*some string', Rule.operations.containsWords)).eql(true);

                should(checkStringField('some other string', 'some string', Rule.operations.containsWords)).eql(false);

                should(checkStringField('some-string', 'some string', Rule.operations.containsWords)).eql(false);
                should(checkStringField('so-me st-ri-ng', 'so.me st.ri.ng', Rule.operations.containsWords)).eql(false);
                should(checkStringField('random woords', 'random w?rds', Rule.operations.containsWords)).eql(false);
                should(checkStringField('random w?ards', 'random w?rds', Rule.operations.containsWords)).eql(false);
                should(checkStringField('random w|rd', 'random w?rds', Rule.operations.containsWords)).eql(false);
                should(checkStringField('random ?rds', 'random w?rds', Rule.operations.containsWords)).eql(false);
                should(checkStringField('testingfail a', 'testing *', Rule.operations.containsWords)).eql(false);
                should(checkStringField('testing the midXdle of the string', '*middle*', Rule.operations.containsWords)).eql(false);
                should(checkStringField('$$$testing the midXdle of the string$$$', '$$$*middle*$$$', Rule.operations.containsWords)).eql(false);
                should(checkStringField('testing the middle of the string', '$$$*middle*$$$', Rule.operations.containsWords)).eql(false);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should correctly check contains', function (done) {
            try {
                should(checkStringField('some string', 'some string', Rule.operations.contains)).eql(true);
                should(checkStringField('so.me st.ri.ng', 'so.me st.ri.ng', Rule.operations.contains)).eql(true);
                should(checkStringField('random words', 'random w?rds', Rule.operations.contains)).eql(true);
                should(checkStringField('random wards', 'random w?rds', Rule.operations.contains)).eql(true);
                should(checkStringField('random w|rds', 'random w?rds', Rule.operations.contains)).eql(true);
                should(checkStringField('random w?rds', 'random w?rds', Rule.operations.contains)).eql(true);
                should(checkStringField('testing *', 'testing *', Rule.operations.contains)).eql(true);
                should(checkStringField('testing ***', 'testing *', Rule.operations.contains)).eql(true);
                should(checkStringField('testing a', 'testing *', Rule.operations.contains)).eql(true);
                should(checkStringField('testing 1', 'testing *', Rule.operations.contains)).eql(true);
                should(checkStringField('testing a random string', 'testing *', Rule.operations.contains)).eql(true);
                should(checkStringField('testing the middle of the string', '*middle*', Rule.operations.contains)).eql(true);
                should(checkStringField('ABCDEF1234567890$$$testing the middle of the string$$$ABCDEF1234567890', '$$$*middle*$$$', Rule.operations.contains)).eql(true);

                should(checkStringField('Xsome string', 'some string', Rule.operations.contains)).eql(true);
                should(checkStringField('some stringX', 'some string', Rule.operations.contains)).eql(true);
                should(checkStringField('Xsome stringX', 'some string', Rule.operations.contains)).eql(true);
                should(checkStringField('in the some string middle', 'some string', Rule.operations.contains)).eql(true);
                should(checkStringField('anything before some string', '*some string', Rule.operations.contains)).eql(true);

                should(checkStringField('some other string', 'some string', Rule.operations.contains)).eql(false);

                should(checkStringField('some-string', 'some string', Rule.operations.contains)).eql(false);
                should(checkStringField('so-me st-ri-ng', 'so.me st.ri.ng', Rule.operations.contains)).eql(false);
                should(checkStringField('random woords', 'random w?rds', Rule.operations.contains)).eql(false);
                should(checkStringField('random w?ards', 'random w?rds', Rule.operations.contains)).eql(false);
                should(checkStringField('random w|rd', 'random w?rds', Rule.operations.contains)).eql(false);
                should(checkStringField('random ?rds', 'random w?rds', Rule.operations.contains)).eql(false);
                should(checkStringField('testingfail a', 'testing *', Rule.operations.contains)).eql(false);
                should(checkStringField('testing the midXdle of the string', '*middle*', Rule.operations.contains)).eql(false);
                should(checkStringField('$$$testing the midXdle of the string$$$', '$$$*middle*$$$', Rule.operations.contains)).eql(false);
                should(checkStringField('testing the middle of the string', '$$$*middle*$$$', Rule.operations.contains)).eql(false);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should correctly check doesNotContain', function (done) {
            try {
                should(checkStringField('some-string', 'some string', Rule.operations.doesNotContain)).eql(true);
                should(checkStringField('so-me st-ri-ng', 'so.me st.ri.ng', Rule.operations.doesNotContain)).eql(true);
                should(checkStringField('random woords', 'random w?rds', Rule.operations.doesNotContain)).eql(true);
                should(checkStringField('random w?ards', 'random w?rds', Rule.operations.doesNotContain)).eql(true);
                should(checkStringField('random w|rd', 'random w?rds', Rule.operations.doesNotContain)).eql(true);
                should(checkStringField('random ?rds', 'random w?rds', Rule.operations.doesNotContain)).eql(true);
                should(checkStringField('testingfail a', 'testing *', Rule.operations.doesNotContain)).eql(true);
                should(checkStringField('testing the midXdle of the string', '*middle*', Rule.operations.doesNotContain)).eql(true);
                should(checkStringField('$$$testing the midXdle of the string$$$', '$$$*middle*$$$', Rule.operations.doesNotContain)).eql(true);
                should(checkStringField('testing the middle of the string', '$$$*middle*$$$', Rule.operations.doesNotContain)).eql(true);

                should(checkStringField('some other string', 'some string', Rule.operations.doesNotContain)).eql(true);

                should(checkStringField('Xsome string', 'some string', Rule.operations.doesNotContain)).eql(false);
                should(checkStringField('some stringX', 'some string', Rule.operations.doesNotContain)).eql(false);
                should(checkStringField('Xsome stringX', 'some string', Rule.operations.doesNotContain)).eql(false);
                should(checkStringField('in the some string middle', 'some string', Rule.operations.doesNotContain)).eql(false);
                should(checkStringField('anything before some string', '*some string', Rule.operations.doesNotContain)).eql(false);

                should(checkStringField('some string', 'some string', Rule.operations.doesNotContain)).eql(false);
                should(checkStringField('so.me st.ri.ng', 'so.me st.ri.ng', Rule.operations.doesNotContain)).eql(false);
                should(checkStringField('random words', 'random w?rds', Rule.operations.doesNotContain)).eql(false);
                should(checkStringField('random wards', 'random w?rds', Rule.operations.doesNotContain)).eql(false);
                should(checkStringField('random w|rds', 'random w?rds', Rule.operations.doesNotContain)).eql(false);
                should(checkStringField('random w?rds', 'random w?rds', Rule.operations.doesNotContain)).eql(false);
                should(checkStringField('testing *', 'testing *', Rule.operations.doesNotContain)).eql(false);
                should(checkStringField('testing ***', 'testing *', Rule.operations.doesNotContain)).eql(false);
                should(checkStringField('testing a', 'testing *', Rule.operations.doesNotContain)).eql(false);
                should(checkStringField('testing 1', 'testing *', Rule.operations.doesNotContain)).eql(false);
                should(checkStringField('testing a random string', 'testing *', Rule.operations.doesNotContain)).eql(false);
                should(checkStringField('testing the middle of the string', '*middle*', Rule.operations.doesNotContain)).eql(false);
                should(checkStringField('ABCDEF1234567890$$$testing the middle of the string$$$ABCDEF1234567890', '$$$*middle*$$$', Rule.operations.doesNotContain)).eql(false);
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('checkNumberField', function () {
        let checkNumberField;
        
        beforeEach(() => {
            checkNumberField = engine.getCheckFunc(1); // number means we get the checkNumber function back
        });
        
        it('should correctly check eq', function (done) {
            try {
                should(checkNumberField(50, 50, Rule.operations.eq)).eql(true);
                should(checkNumberField(0, 0, Rule.operations.eq)).eql(true);
                should(checkNumberField(-10, 10, Rule.operations.eq)).eql(true);         // absolute field value is used
                should(checkNumberField(0.5, 0.5, Rule.operations.eq)).eql(true);
                should(checkNumberField(0.50, 0.5, Rule.operations.eq)).eql(true);

                should(checkNumberField(49, 50, Rule.operations.eq)).eql(false);
                should(checkNumberField(50, 49, Rule.operations.eq)).eql(false);
                should(checkNumberField(50, -50, Rule.operations.eq)).eql(false);
                should(checkNumberField(0.5, 0.49, Rule.operations.eq)).eql(false);
                should(checkNumberField(0.5, 0.499999999, Rule.operations.eq)).eql(false);
                should(checkNumberField(0, 1, Rule.operations.eq)).eql(false);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should correctly check lt', function (done) {
            try {
                should(checkNumberField(49, 50, Rule.operations.lt)).eql(true);
                should(checkNumberField(0, 1, Rule.operations.lt)).eql(true);
                should(checkNumberField(0.5, 0.500001, Rule.operations.lt)).eql(true);
                should(checkNumberField(0.50, 1, Rule.operations.lt)).eql(true);

                should(checkNumberField(50, 50, Rule.operations.lt)).eql(false);
                should(checkNumberField(0, 0, Rule.operations.lt)).eql(false);
                should(checkNumberField(-1, -1, Rule.operations.lt)).eql(false);

                should(checkNumberField(-50, 50, Rule.operations.lt)).eql(false);     // absolute values are used for field
                should(checkNumberField(-1, 0, Rule.operations.lt)).eql(false);       // absolute values are used for field
                should(checkNumberField(50, 49, Rule.operations.lt)).eql(false);
                should(checkNumberField(50, -50, Rule.operations.lt)).eql(false);
                should(checkNumberField(0, -1, Rule.operations.lt)).eql(false);
                should(checkNumberField(1, 0, Rule.operations.lt)).eql(false);
                should(checkNumberField(0.5000001, 0.5, Rule.operations.lt)).eql(false);
                should(checkNumberField(1, 0.50, Rule.operations.lt)).eql(false);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should correctly check gt', function (done) {
            try {
                should(checkNumberField(50, 49, Rule.operations.gt)).eql(true);
                should(checkNumberField(50, -50, Rule.operations.gt)).eql(true);
                should(checkNumberField(0, -1, Rule.operations.gt)).eql(true);
                should(checkNumberField(1, 0, Rule.operations.gt)).eql(true);
                should(checkNumberField(0.5000001, 0.5, Rule.operations.gt)).eql(true);
                should(checkNumberField(1, 0.50, Rule.operations.gt)).eql(true);
                should(checkNumberField(-1, -1, Rule.operations.gt)).eql(true);      // absolute values used for field
                should(checkNumberField(-1, 0, Rule.operations.gt)).eql(true);      // absolute values used for field

                should(checkNumberField(50, 50, Rule.operations.gt)).eql(false);
                should(checkNumberField(0, 0, Rule.operations.gt)).eql(false);

                should(checkNumberField(49, 50, Rule.operations.gt)).eql(false);
                should(checkNumberField(-50, 50, Rule.operations.gt)).eql(false);
                should(checkNumberField(0, 1, Rule.operations.gt)).eql(false);
                should(checkNumberField(0.5, 0.500001, Rule.operations.gt)).eql(false);
                should(checkNumberField(0.50, 1, Rule.operations.gt)).eql(false);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should correctly check lte', function (done) {
            try {
                should(checkNumberField(49, 50, Rule.operations.lte)).eql(true);
                should(checkNumberField(-50, 50, Rule.operations.lte)).eql(true);
                should(checkNumberField(0, 1, Rule.operations.lte)).eql(true);
                should(checkNumberField(0.5, 0.500001, Rule.operations.lte)).eql(true);
                should(checkNumberField(0.50, 1, Rule.operations.lte)).eql(true);

                should(checkNumberField(50, 50, Rule.operations.lte)).eql(true);
                should(checkNumberField(0, 0, Rule.operations.lte)).eql(true);

                should(checkNumberField(-1, -1, Rule.operations.lte)).eql(false);     // absolute values used for field
                should(checkNumberField(-1, 0, Rule.operations.lte)).eql(false);     // absolute values used for field
                should(checkNumberField(50, 49, Rule.operations.lte)).eql(false);
                should(checkNumberField(50, -50, Rule.operations.lte)).eql(false);
                should(checkNumberField(0, -1, Rule.operations.lte)).eql(false);
                should(checkNumberField(1, 0, Rule.operations.lte)).eql(false);
                should(checkNumberField(0.5000001, 0.5, Rule.operations.lte)).eql(false);
                should(checkNumberField(1, 0.50, Rule.operations.lte)).eql(false);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should correctly check gte', function (done) {
            try {
                should(checkNumberField(50, 49, Rule.operations.gte)).eql(true);
                should(checkNumberField(50, -50, Rule.operations.gte)).eql(true);
                should(checkNumberField(0, -1, Rule.operations.gte)).eql(true);
                should(checkNumberField(1, 0, Rule.operations.gte)).eql(true);
                should(checkNumberField(0.5000001, 0.5, Rule.operations.gte)).eql(true);
                should(checkNumberField(1, 0.50, Rule.operations.gte)).eql(true);
                should(checkNumberField(-50, 50, Rule.operations.gte)).eql(true);    // absolute values used for field

                should(checkNumberField(50, 50, Rule.operations.gte)).eql(true);
                should(checkNumberField(0, 0, Rule.operations.gte)).eql(true);
                should(checkNumberField(-1, -1, Rule.operations.gte)).eql(true);    // absolute values used for field
                should(checkNumberField(-1, 0, Rule.operations.gte)).eql(true);

                should(checkNumberField(49, 50, Rule.operations.gte)).eql(false);
                should(checkNumberField(0, 1, Rule.operations.gte)).eql(false);
                should(checkNumberField(0.5, 0.500001, Rule.operations.gte)).eql(false);
                should(checkNumberField(0.50, 1, Rule.operations.gte)).eql(false);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('checkDateField', function () {
        let checkDateField;

        beforeEach(() => {
            checkDateField = engine.getCheckFunc(new Date()); // number means we get the checkNumber function back
        });
        
        describe('dom (day-of-month)', function () {
            it('should correctly check eq', function (done) {
                try {
                    let field = new Date('2017-03-01');
                    should(checkDateField(field, 1, Rule.operations.eq)).eql(true);

                    should(checkDateField(field, 2, Rule.operations.eq)).eql(false);
                    should(checkDateField(field, 31, Rule.operations.eq)).eql(false);
                    should(checkDateField(field, -1, Rule.operations.eq)).eql(false);

                    field = new Date('2016-02-29');
                    should(checkDateField(field, 29, Rule.operations.eq)).eql(true);

                    should(checkDateField(field, 28, Rule.operations.eq)).eql(false);
                    should(checkDateField(field, 30, Rule.operations.eq)).eql(false);

                    field = new Date('2016-02-28');
                    should(checkDateField(field, 28, Rule.operations.eq)).eql(true);

                    field = new Date('2017-02-28');
                    should(checkDateField(field, 28, Rule.operations.eq)).eql(true);

                    field = new Date('2017-12-31');
                    should(checkDateField(field, 31, Rule.operations.eq)).eql(true);

                    should(checkDateField(field, 30, Rule.operations.eq)).eql(false);
                    should(checkDateField(field, 29, Rule.operations.eq)).eql(false);
                    should(checkDateField(field, 1, Rule.operations.eq)).eql(false);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should correctly check lt', function (done) {
                try {
                    let field = new Date('2017-01-15');
                    should(checkDateField(field, 16, Rule.operations.lt)).eql(true);
                    should(checkDateField(field, 15.0001, Rule.operations.lt)).eql(true); // should pass, we don't validate date range here
                    should(checkDateField(field, 25, Rule.operations.lt)).eql(true);
                    should(checkDateField(field, 31, Rule.operations.lt)).eql(true);
                    should(checkDateField(field, 100, Rule.operations.lt)).eql(true); // as above

                    should(checkDateField(field, 15, Rule.operations.lt)).eql(false);
                    should(checkDateField(field, 14, Rule.operations.lt)).eql(false);
                    should(checkDateField(field, 1, Rule.operations.lt)).eql(false);
                    should(checkDateField(field, -11, Rule.operations.lt)).eql(false); // as above

                    field = new Date('2016-02-29');
                    should(checkDateField(field, 30, Rule.operations.lt)).eql(true);
                    should(checkDateField(field, 31, Rule.operations.lt)).eql(true);
                    should(checkDateField(field, 29.9, Rule.operations.lt)).eql(true); // again we don't validate the values here, so this should pass

                    should(checkDateField(field, 29, Rule.operations.lt)).eql(false);
                    should(checkDateField(field, 28, Rule.operations.lt)).eql(false);
                    should(checkDateField(field, 1, Rule.operations.lt)).eql(false); // as above
                    should(checkDateField(field, 28.999, Rule.operations.lt)).eql(false); // as above

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should correctly check gt', function (done) {
                try {
                    let field = new Date('2017-01-15');
                    should(checkDateField(field, -1, Rule.operations.gt)).eql(true); // -1 should pass, we don't validate date range here
                    should(checkDateField(field, 1, Rule.operations.gt)).eql(true);
                    should(checkDateField(field, 14, Rule.operations.gt)).eql(true);

                    should(checkDateField(field, 15, Rule.operations.gt)).eql(false);
                    should(checkDateField(field, 15.0001, Rule.operations.gt)).eql(false);
                    should(checkDateField(field, 31, Rule.operations.gt)).eql(false);

                    field = new Date('2016-02-29');
                    should(checkDateField(field, 28, Rule.operations.gt)).eql(true);
                    should(checkDateField(field, 28.999, Rule.operations.gt)).eql(true); // as above
                    should(checkDateField(field, 1, Rule.operations.gt)).eql(true);
                    should(checkDateField(field, -1, Rule.operations.gt)).eql(true); // as above

                    should(checkDateField(field, 29, Rule.operations.gt)).eql(false);
                    should(checkDateField(field, 30, Rule.operations.gt)).eql(false);
                    should(checkDateField(field, 1000, Rule.operations.gt)).eql(false);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should correctly check lte', function (done) {
                try {
                    let field = new Date('2017-01-15');
                    should(checkDateField(field, 15, Rule.operations.lte)).eql(true);
                    should(checkDateField(field, 16, Rule.operations.lte)).eql(true);
                    should(checkDateField(field, 15.0001, Rule.operations.lte)).eql(true); // should pass, we don't validate date range here
                    should(checkDateField(field, 25, Rule.operations.lte)).eql(true);
                    should(checkDateField(field, 31, Rule.operations.lte)).eql(true);
                    should(checkDateField(field, 100, Rule.operations.lte)).eql(true); // as above

                    should(checkDateField(field, 14, Rule.operations.lte)).eql(false);
                    should(checkDateField(field, 1, Rule.operations.lte)).eql(false);
                    should(checkDateField(field, -11, Rule.operations.lte)).eql(false); // as above

                    field = new Date('2016-02-29');
                    should(checkDateField(field, 29, Rule.operations.lte)).eql(true);
                    should(checkDateField(field, 30, Rule.operations.lte)).eql(true);
                    should(checkDateField(field, 31, Rule.operations.lte)).eql(true);
                    should(checkDateField(field, 29.9, Rule.operations.lte)).eql(true); // again we don't validate the values here, so this should pass

                    should(checkDateField(field, 28, Rule.operations.lte)).eql(false);
                    should(checkDateField(field, 1, Rule.operations.lte)).eql(false); // as above
                    should(checkDateField(field, 28.999, Rule.operations.lte)).eql(false); // as above

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should correctly check gte', function (done) {
                try {
                    let field = new Date('2017-01-15');
                    should(checkDateField(field, 15, Rule.operations.gte)).eql(true);
                    should(checkDateField(field, -1, Rule.operations.gte)).eql(true); // -1 should pass, we don't validate date range here
                    should(checkDateField(field, 1, Rule.operations.gte)).eql(true);
                    should(checkDateField(field, 14, Rule.operations.gte)).eql(true);

                    should(checkDateField(field, 15.0001, Rule.operations.gte)).eql(false);
                    should(checkDateField(field, 31, Rule.operations.gte)).eql(false);

                    field = new Date('2016-02-29');
                    should(checkDateField(field, 29, Rule.operations.gte)).eql(true);
                    should(checkDateField(field, 28, Rule.operations.gte)).eql(true);
                    should(checkDateField(field, 28.999, Rule.operations.gte)).eql(true); // as above
                    should(checkDateField(field, 1, Rule.operations.gte)).eql(true);
                    should(checkDateField(field, -1, Rule.operations.gte)).eql(true); // as above

                    should(checkDateField(field, 30, Rule.operations.gte)).eql(false);
                    should(checkDateField(field, 1000, Rule.operations.gte)).eql(false);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });

        describe('dow (day-of-week)', function () {
            it('should correctly check eq', function (done) {
                try {
                    let field = new Date('2017-03-05'); // sunday, 0 day of the week, but we've assumed 1 based indexing so it's consistent with day-of-month
                    should(checkDateField(field, 1, Rule.operations.eq, undefined, 'dow')).eql(true);

                    should(checkDateField(field, 0, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 2, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 3, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 4, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 5, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 6, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 7, Rule.operations.eq, undefined, 'dow')).eql(false);


                    field = new Date('2017-03-08'); // wed, 3 day of week, but we use 4 (as above)
                    should(checkDateField(field, 4, Rule.operations.eq, undefined, 'dow')).eql(true);

                    should(checkDateField(field, 0, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 1, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 2, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 3, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 5, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 6, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 7, Rule.operations.eq, undefined, 'dow')).eql(false);

                    field = new Date('2017-03-11'); // saturday, 6 day of the week, but we use 7 (as above)
                    should(checkDateField(field, 7, Rule.operations.eq, undefined, 'dow')).eql(true);

                    should(checkDateField(field, 0, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 1, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 2, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 3, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 4, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 5, Rule.operations.eq, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 6, Rule.operations.eq, undefined, 'dow')).eql(false);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should correctly check lt', function (done) {
                try {
                    let field = new Date('2017-03-05'); // sunday, 0 day of the week, but we've assumed 1 based indexing so it's consistent with day-of-month
                    should(checkDateField(field, 2, Rule.operations.lt, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 3, Rule.operations.lt, undefined, 'dow')).eql(true); // as other places, we don't validate the values
                    should(checkDateField(field, 9, Rule.operations.lt, undefined, 'dow')).eql(true); // and again

                    should(checkDateField(field, 1, Rule.operations.lt, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 0.999, Rule.operations.lt, undefined, 'dow')).eql(false); // as other places, we don't validate the values
                    should(checkDateField(field, 0, Rule.operations.lt, undefined, 'dow')).eql(false);
                    should(checkDateField(field, -1, Rule.operations.lt, undefined, 'dow')).eql(false); // and again

                    field = new Date('2017-03-08'); // wed, 3 day of week, but we use 4 (as above)
                    should(checkDateField(field, 5, Rule.operations.lt, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 6, Rule.operations.lt, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 6.001, Rule.operations.lt, undefined, 'dow')).eql(true);

                    should(checkDateField(field, 4, Rule.operations.lt, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 3, Rule.operations.lt, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 2, Rule.operations.lt, undefined, 'dow')).eql(false);
                    should(checkDateField(field, -1, Rule.operations.lt, undefined, 'dow')).eql(false);

                    field = new Date('2017-03-11'); // saturday, 6 day of the week, but we use 7 (as above)
                    should(checkDateField(field, 8, Rule.operations.lt, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 8.00001, Rule.operations.lt, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 100, Rule.operations.lt, undefined, 'dow')).eql(true);

                    should(checkDateField(field, 7, Rule.operations.lt, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 6, Rule.operations.lt, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 5.999999, Rule.operations.lt, undefined, 'dow')).eql(false);
                    should(checkDateField(field, -100, Rule.operations.lt, undefined, 'dow')).eql(false);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should correctly check gt', function (done) {
                try {
                    let field = new Date('2017-03-05'); // sunday, 0 day of the week, but we've assumed 1 based indexing so it's consistent with day-of-month
                    should(checkDateField(field, 0, Rule.operations.gt, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 0.999, Rule.operations.gt, undefined, 'dow')).eql(true); // as other places, we don't validate the values
                    should(checkDateField(field, -1, Rule.operations.gt, undefined, 'dow')).eql(true); // and again

                    should(checkDateField(field, 1, Rule.operations.gt, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 1.000001, Rule.operations.gt, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 2, Rule.operations.gt, undefined, 'dow')).eql(false); // as other places, we don't validate the values
                    should(checkDateField(field, 9, Rule.operations.gt, undefined, 'dow')).eql(false); // and again

                    field = new Date('2017-03-08'); // wed, 3 day of week, but we use 4 (as above)
                    should(checkDateField(field, 3, Rule.operations.gt, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 2, Rule.operations.gt, undefined, 'dow')).eql(true);
                    should(checkDateField(field, -1, Rule.operations.gt, undefined, 'dow')).eql(true);

                    should(checkDateField(field, 4, Rule.operations.gt, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 4.00001, Rule.operations.gt, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 6, Rule.operations.gt, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 600.001, Rule.operations.gt, undefined, 'dow')).eql(false);

                    field = new Date('2017-03-11'); // saturday, 6 day of the week, but we use 7 (as above)
                    should(checkDateField(field, 6, Rule.operations.gt, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 5.999999, Rule.operations.gt, undefined, 'dow')).eql(true);
                    should(checkDateField(field, -100, Rule.operations.gt, undefined, 'dow')).eql(true);

                    should(checkDateField(field, 7, Rule.operations.gt, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 8, Rule.operations.gt, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 8.00001, Rule.operations.gt, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 100, Rule.operations.gt, undefined, 'dow')).eql(false);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should correctly check lte', function (done) {
                try {
                    let field = new Date('2017-03-05'); // sunday, 0 day of the week, but we've assumed 1 based indexing so it's consistent with day-of-month
                    should(checkDateField(field, 1, Rule.operations.lte, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 2, Rule.operations.lte, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 3, Rule.operations.lte, undefined, 'dow')).eql(true); // as other places, we don't validate the values
                    should(checkDateField(field, 9, Rule.operations.lte, undefined, 'dow')).eql(true); // and again

                    should(checkDateField(field, 0.999, Rule.operations.lte, undefined, 'dow')).eql(false); // as other places, we don't validate the values
                    should(checkDateField(field, 0, Rule.operations.lte, undefined, 'dow')).eql(false);
                    should(checkDateField(field, -1, Rule.operations.lte, undefined, 'dow')).eql(false); // and again

                    field = new Date('2017-03-08'); // wed, 3 day of week, but we use 4 (as above)
                    should(checkDateField(field, 4, Rule.operations.lte, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 5, Rule.operations.lte, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 6, Rule.operations.lte, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 6.001, Rule.operations.lte, undefined, 'dow')).eql(true);

                    should(checkDateField(field, 3, Rule.operations.lte, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 2, Rule.operations.lte, undefined, 'dow')).eql(false);
                    should(checkDateField(field, -1, Rule.operations.lte, undefined, 'dow')).eql(false);

                    field = new Date('2017-03-11'); // saturday, 6 day of the week, but we use 7 (as above)
                    should(checkDateField(field, 7, Rule.operations.lte, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 8, Rule.operations.lte, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 8.00001, Rule.operations.lte, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 100, Rule.operations.lte, undefined, 'dow')).eql(true);

                    should(checkDateField(field, 6, Rule.operations.lte, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 5.999999, Rule.operations.lte, undefined, 'dow')).eql(false);
                    should(checkDateField(field, -100, Rule.operations.lte, undefined, 'dow')).eql(false);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should correctly check gte', function (done) {
                try {
                    let field = new Date('2017-03-05'); // sunday, 0 day of the week, but we've assumed 1 based indexing so it's consistent with day-of-month
                    should(checkDateField(field, 1, Rule.operations.gte, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 0.999, Rule.operations.gte, undefined, 'dow')).eql(true); // as other places, we don't validate the values
                    should(checkDateField(field, 0, Rule.operations.gte, undefined, 'dow')).eql(true);
                    should(checkDateField(field, -1, Rule.operations.gte, undefined, 'dow')).eql(true); // and again

                    should(checkDateField(field, 2, Rule.operations.gte, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 3, Rule.operations.gte, undefined, 'dow')).eql(false); // as other places, we don't validate the values
                    should(checkDateField(field, 9, Rule.operations.gte, undefined, 'dow')).eql(false); // and again

                    field = new Date('2017-03-08'); // wed, 3 day of week, but we use 4 (as above)
                    should(checkDateField(field, 4, Rule.operations.gte, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 3, Rule.operations.gte, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 2, Rule.operations.gte, undefined, 'dow')).eql(true);
                    should(checkDateField(field, -1, Rule.operations.gte, undefined, 'dow')).eql(true);

                    should(checkDateField(field, 5, Rule.operations.gte, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 6, Rule.operations.gte, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 6.001, Rule.operations.gte, undefined, 'dow')).eql(false);


                    field = new Date('2017-03-11'); // saturday, 6 day of the week, but we use 7 (as above)
                    should(checkDateField(field, 7, Rule.operations.gte, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 6, Rule.operations.gte, undefined, 'dow')).eql(true);
                    should(checkDateField(field, 5.999999, Rule.operations.gte, undefined, 'dow')).eql(true);
                    should(checkDateField(field, -100, Rule.operations.gte, undefined, 'dow')).eql(true);

                    should(checkDateField(field, 8, Rule.operations.gte, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 8.00001, Rule.operations.gte, undefined, 'dow')).eql(false);
                    should(checkDateField(field, 100, Rule.operations.gte, undefined, 'dow')).eql(false);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });

        describe('abs (absolute-date)', function () {
            it('should correctly check eq', function (done) {
                try {
                    let field = new Date('2017-12-31');
                    should(checkDateField(field, '2017-12-31', Rule.operations.eq, undefined, 'abs')).eql(true);

                    should(checkDateField(field, '2018-01-01', Rule.operations.eq, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2017-12-30', Rule.operations.eq, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2016-02-29', Rule.operations.eq, undefined, 'abs')).eql(false);

                    field = new Date('2016-02-29');
                    should(checkDateField(field, '2016-02-29', Rule.operations.eq, undefined, 'abs')).eql(true);

                    should(checkDateField(field, '2016-02-28', Rule.operations.eq, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2016-02-30', Rule.operations.eq, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2016-03-01', Rule.operations.eq, undefined, 'abs')).eql(false);

                    done();

                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should correctly check lt', function (done) {
                try {
                    let field = new Date('2017-12-31');
                    should(checkDateField(field, '2018-01-01', Rule.operations.lt, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2018-12-31', Rule.operations.lt, undefined, 'abs')).eql(true);

                    should(checkDateField(field, '2017-12-31', Rule.operations.lt, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2017-12-01', Rule.operations.lt, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2016-12-31', Rule.operations.lt, undefined, 'abs')).eql(false);

                    field = new Date('2016-02-01');
                    should(checkDateField(field, '2016-02-02', Rule.operations.lt, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2016-02-28', Rule.operations.lt, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2016-02-29', Rule.operations.lt, undefined, 'abs')).eql(true);

                    should(checkDateField(field, '2016-02-01', Rule.operations.lt, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2016-01-31', Rule.operations.lt, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2016-01-01', Rule.operations.lt, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2015-12-31', Rule.operations.lt, undefined, 'abs')).eql(false);

                    done();

                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should correctly check gt', function (done) {
                try {
                    let field = new Date('2017-12-31');
                    should(checkDateField(field, '2017-12-30', Rule.operations.gt, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2017-12-01', Rule.operations.gt, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2016-12-31', Rule.operations.gt, undefined, 'abs')).eql(true);

                    should(checkDateField(field, '2017-12-31', Rule.operations.gt, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2018-01-01', Rule.operations.gt, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2018-12-31', Rule.operations.gt, undefined, 'abs')).eql(false);

                    field = new Date('2016-02-01');
                    should(checkDateField(field, '2016-01-31', Rule.operations.gt, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2016-01-01', Rule.operations.gt, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2015-12-31', Rule.operations.gt, undefined, 'abs')).eql(true);

                    should(checkDateField(field, '2016-02-01', Rule.operations.gt, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2016-02-02', Rule.operations.gt, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2016-02-28', Rule.operations.gt, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2016-02-29', Rule.operations.gt, undefined, 'abs')).eql(false);

                    done();

                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should correctly check lte', function (done) {
                try {
                    let field = new Date('2017-12-31');
                    should(checkDateField(field, '2017-12-31', Rule.operations.lte, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2018-01-01', Rule.operations.lte, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2018-12-31', Rule.operations.lte, undefined, 'abs')).eql(true);

                    should(checkDateField(field, '2017-12-01', Rule.operations.lte, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2016-12-31', Rule.operations.lte, undefined, 'abs')).eql(false);

                    field = new Date('2016-02-01');
                    should(checkDateField(field, '2016-02-01', Rule.operations.lte, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2016-02-02', Rule.operations.lte, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2016-02-28', Rule.operations.lte, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2016-02-29', Rule.operations.lte, undefined, 'abs')).eql(true);

                    should(checkDateField(field, '2016-01-31', Rule.operations.lte, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2016-01-01', Rule.operations.lte, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2015-12-31', Rule.operations.lte, undefined, 'abs')).eql(false);

                    done();

                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });

            it('should correctly check gte', function (done) {
                try {
                    let field = new Date('2017-12-31');
                    should(checkDateField(field, '2017-12-31', Rule.operations.gte, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2017-12-30', Rule.operations.gte, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2017-12-01', Rule.operations.gte, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2016-12-31', Rule.operations.gte, undefined, 'abs')).eql(true);

                    should(checkDateField(field, '2018-01-01', Rule.operations.gte, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2018-12-31', Rule.operations.gte, undefined, 'abs')).eql(false);

                    field = new Date('2016-02-01');
                    should(checkDateField(field, '2016-02-01', Rule.operations.gte, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2016-01-31', Rule.operations.gte, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2016-01-01', Rule.operations.gte, undefined, 'abs')).eql(true);
                    should(checkDateField(field, '2015-12-31', Rule.operations.gte, undefined, 'abs')).eql(true);

                    should(checkDateField(field, '2016-02-02', Rule.operations.gte, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2016-02-28', Rule.operations.gte, undefined, 'abs')).eql(false);
                    should(checkDateField(field, '2016-02-29', Rule.operations.gte, undefined, 'abs')).eql(false);

                    done();

                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });
    });
});