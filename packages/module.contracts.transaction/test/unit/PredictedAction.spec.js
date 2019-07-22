const PredictedAction = require('../../lib/PredictedAction');
const should = require('should');
const resources = require('@sage/bc-common-resources');
const { StatusCodeError } = require('@sage/bc-statuscodeerror');
const _ = require('underscore');
const sinon = require('sinon');

describe('@sage/bc-Transaction.PredictedAction', function(){
    let sandbox;
    let data;

    beforeEach(function () {
        sandbox = sinon.createSandbox();

        data = {
            predictionId: 'dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc',
            rules: [ { ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc', ruleRank: 1, match: 'true' } ],
            score: 100,
            source: 'User',
            action: {
                accountsPostings: [{
                    accountantNarrative: 'narr',
                    createdBy: 'GP',
                    grossAmount: 120,
                    netAmount: 100,
                    taxAmount: 20,
                    postingInstructions: [{
                        type: 'supplier',
                        code: 'SUPP1',
                        name: 'SAINSBURYS PLC',
                        status: 'Account on Hold',
                        value: -20.00,
                        description: 'desc',
                        userDefinedTypeName: 'typename'
                    }]
                }],
                ruleAdditionalFields: [],
                reference: 'ref',
                type: 'type'
            },
        };
    })

    afterEach(function(){
        sandbox.restore();
    });

    describe('constructor', function () {
        it('should create an instance of PredictedAction', function (done) {
            try {
                let newPredictedAction = new PredictedAction();
                newPredictedAction.should.be.instanceof(PredictedAction);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should assign properties', function (done) {
            try {
                let newPredictedAction = new PredictedAction(data);
                should(JSON.parse(JSON.stringify(newPredictedAction))).eql(data);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should not assign properties not on contract', function (done) {
            try {
                data.junk = 'wahwahwah';
                let newPredictedAction = new PredictedAction(data);
                should.not.exists(newPredictedAction.junk);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should assign default properties', function (done) {
            try {
                let newPredictedAction = new PredictedAction();
                should(JSON.parse(JSON.stringify(newPredictedAction))).eql({});
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should calling Create assign default properties', (done) => {
            try {
                let newPredictedAction = PredictedAction.Create();
                should(JSON.parse(JSON.stringify(newPredictedAction))).eql({});
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should create a PredictedAction when calling CreateForPostingAndRule for user', (done) => {
            try {
                const accountsPostings = [];
                const newPredictedAction = PredictedAction.CreateForPostingsAndRule(accountsPostings, {uuid: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc', ruleRank: 1, ruleType: 'User' });
                // reset generated uuid
                newPredictedAction.predictionId = 'dd68c877-8e14-40d4-a80f-ca9ebe135eea';
                should(JSON.parse(JSON.stringify(newPredictedAction))).eql({
                    action: {
                        accountsPostings: [],
                        ruleAdditionalFields: [],
                        reference: null,
                        type: null
                    },
                    predictionId: 'dd68c877-8e14-40d4-a80f-ca9ebe135eea',
                    rules: [
                        {
                            match: 'full',
                            ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc',
                            ruleRank: 1
                        }
                    ],
                    score: 100,
                    source: 'User'
                });
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should create a PredictedAction when calling CreateForPostingAndRule for feedback', (done) => {
            try {
                const accountsPostings = [];
                const newPredictedAction = PredictedAction.CreateForPostingsAndRule(accountsPostings, {uuid: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc', ruleRank: 1, ruleType: 'Feedback' });
                // reset generated uuid
                newPredictedAction.predictionId = 'dd68c877-8e14-40d4-a80f-ca9ebe135eea';
                should(JSON.parse(JSON.stringify(newPredictedAction))).eql({
                    action: {
                        accountsPostings: [],
                        ruleAdditionalFields: [],
                        reference: null,
                        type: null
                    },
                    predictionId: 'dd68c877-8e14-40d4-a80f-ca9ebe135eea',
                    rules: [
                        {
                            match: 'full',
                            ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc',
                            ruleRank: 1
                        }
                    ],
                    score: 0,
                    source: 'Feedback'
                });
                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('PredictedAction.prototype.validate', function () {
        it('should call PredictedAction.validate', function (done) {
            sandbox.stub(PredictedAction, 'validate');

            try {
                let newPredictedAction = new PredictedAction(data);
                newPredictedAction.validate();

                PredictedAction.validate.callCount.should.eql(1);
                PredictedAction.validate.firstCall.args[0].should.eql(newPredictedAction);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('PredictedAction.validate', function () {
        let newPredictedAction;

        beforeEach(function () {
            newPredictedAction = new PredictedAction(data);
        });

        const tests = [
            {
                target: 'predictionId', tests: [
                    {it: 'should not throw if predictionId is undefined', value: undefined, error: false},
                    {it: 'should throw if predictionId is null', value: null, error: false},
                    {it: 'should throw if predictionId is an empty string', value: '', error: true},
                    {it: 'should throw if predictionId is not a valid uuid', value: 'not-a-uuid', error: true},
                    {it: 'should throw if predictionId is a number', value: 9, error: true},
                    {it: 'should throw if predictionId is an object', value: {}, error: true}
                ]},
            {
                target: 'score', tests: [
                    {it: 'should not throw if score is undefined', value: undefined, error: false},
                    {it: 'should not throw if score is null', value: null, error: false},
                    {it: 'should throw if score is an empty string', value: '', error: true},
                    {it: 'should throw if score is a string', value: 'not-a-uuid', error: true},
                    {it: 'should not throw if score is a number', value: 9, error: false},
                    {it: 'should throw if score is an object', value: {}, error: true}
                ]},
            {
                target: 'source', tests: [
                    {it: 'should not throw if source is undefined', value: undefined, error: false},
                    {it: 'should not throw if source is null', value: null, error: false},
                    {it: 'should not throw if source is valid', value: 'Accountant', error: false},
                    {it: 'should throw if source is an empty string', value: '', error: true},
                    {it: 'should throw if source is not a valid source', value: 'not-valid', error: true},
                    {it: 'should throw if source is a number', value: 9, error: true},
                    {it: 'should throw if source is an object', value: {}, error: true}
                ]},
            {
                target: 'rules', tests: [
                    {it: 'should throw if rules is undefined', value: undefined, error: true},
                    {it: 'should throw if rules is null', value: null, error: true},
                    {it: 'should not throw if rules is an empty array', value: [], error: false},
                    {it: 'should not throw if rules is valid', value: [ { ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc', ruleRank: 1, match: 'true' } ], error: false},
                    {it: 'should throw if rules is an empty string', value: '', error: true},
                    {it: 'should throw if rules is not a valid source', value: 'not-valid', error: true},
                    {it: 'should throw if rules is a number', value: 9, error: true},
                    {it: 'should throw if rules is an object', value: {}, error: true},
                    {
                        it: 'should not throw if rules.ruleId is undefined',
                        value: [{
                            ruleId: undefined,
                            ruleRank: 1,
                            match: 'true'
                        }],
                        error: false
                    },
                    {
                        it: 'should not throw if rules.ruleId is null',
                        value: [{
                            ruleId: null,
                            ruleRank: 1,
                            match: 'true'
                        }],
                        error: false
                    },
                    {
                        it: 'should not throw if rules.ruleId is a uuid',
                        value: [{
                            ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc',
                            ruleRank: 1,
                            match: 'true'
                        }],
                        error: false
                    },
                    {
                        it: 'should throw if rules.ruleId is a string',
                        value: [{
                            ruleId: 'invalid',
                            ruleRank: 1,
                            match: 'true'
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if rules.ruleId is a number',
                        value: [{
                            ruleId: 1,
                            ruleRank: 1,
                            match: 'true'
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if rules.ruleId is an object',
                        value: [{
                            ruleId: {},
                            ruleRank: 1,
                            match: 'true'
                        }],
                        error: true
                    },
                    {
                        it: 'should not throw if rules.ruleRank is undefined',
                        value: [{
                            ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc',
                            ruleRank: undefined,
                            match: 'true'
                        }],
                        error: false
                    },
                    {
                        it: 'should not throw if rules.ruleRank is null',
                        value: [{
                            ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc',
                            ruleRank: null,
                            match: 'true'
                        }],
                        error: false
                    },
                    {
                        it: 'should throw if rules.ruleRank is a string',
                        value: [{
                            ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc',
                            ruleRank: '1',
                            match: 'true'
                        }],
                        error: true
                    },
                    {
                        it: 'should not throw if rules.ruleRank is a number',
                        value: [{
                            ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc',
                            ruleRank: 1,
                            match: 'true'
                        }],
                        error: false
                    },
                    {
                        it: 'should throw if rules.ruleRank is an object',
                        value: [{
                            ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc',
                            ruleRank: {},
                            match: 'true'
                        }],
                        error: true
                    },
                    {
                        it: 'should not throw if rules.match is undefined',
                        value: [{
                            ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc',
                            ruleRank: 1,
                            match: undefined
                        }],
                        error: false
                    },
                    {
                        it: 'should not throw if rules.match is null',
                        value: [{
                            ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc',
                            ruleRank: 1,
                            match: null
                        }],
                        error: false
                    },
                    {
                        it: 'should not throw if rules.match is a string',
                        value: [{
                            ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc',
                            ruleRank: 1,
                            match: 'true'
                        }],
                        error: false
                    },
                    {
                        it: 'should throw if rules.match is a number',
                        value: [{
                            ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc',
                            ruleRank: 1,
                            match: 1
                        }],
                        error: true
                    },
                    {
                        it: 'should throw if rules.match is an object',
                        value: [{
                            ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc',
                            ruleRank: 1,
                            match: {}
                        }],
                        error: true
                    }
                ]},
        ];

        var runTest = function (target, tests) {
            describe(target, function () {
                _.each(tests, function (test, index) {
                    it(test.it, function (done) {
                        try {
                            newPredictedAction[target] = test.value;
                            var result = test.error ? new Error(target + ' test ' + index + ': should have thrown') : undefined;

                            PredictedAction.validate(newPredictedAction);

                            done(result);
                        } catch (err) {
                            if (!test.error) {
                                done((err instanceof Error) ? err : new Error());
                            } else {
                                console.log('YYY params', err.items[0].params);
                                err.should.be.instanceOf(StatusCodeError);
                                err.statusCode.should.eql(400);
                                err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);
                                console.log('YYY target', target);
                                console.log('YYY err.items[0].params', err.items[0].params);
                                console.log('YYY test value', test.value);

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

        describe('predictedAction.action', () => {

            it('should not throw action with type string', (done) => {
                try {
                    newPredictedAction.action = {
                        type: 'type',
                        reference: 'reference',
                        ruleAdditionalFields: [],
                        accountsPostings: []
                    };
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw action with type numeric', (done) => {
                try {
                    newPredictedAction.action = {
                        type: 1,
                        reference: 'reference',
                        accountsPostings: []
                    };
                    PredictedAction.validate(newPredictedAction);
                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw action with type object', (done) => {
                try {
                    newPredictedAction.action = {
                        type: {},
                        reference: 'reference',
                        accountsPostings: []
                    };
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw action with type null', (done) => {
                try {
                    newPredictedAction.action = {
                        type: null,
                        reference: 'reference',
                        accountsPostings: []
                    };
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should not throw action with type undefined', (done) => {
                try {
                    newPredictedAction.action = {
                        type: undefined,
                        reference: 'reference',
                        ruleAdditionalFields: [],
                        accountsPostings: []
                    };
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should not throw action with reference string', (done) => {
                try {
                    newPredictedAction.action = {
                        type: 'type',
                        reference: 'reference',
                        ruleAdditionalFields: [],
                        accountsPostings: []
                    };
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw action with reference numeric', (done) => {
                try {
                    newPredictedAction.action = {
                        type: 'type',
                        reference: 1,
                        accountsPostings: []
                    };
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw action with reference object', (done) => {
                try {
                    newPredictedAction.action = {
                        type: 'type',
                        reference: {},
                        accountsPostings: []
                    };
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw action with reference null', (done) => {
                try {
                    newPredictedAction.action = {
                        type: 'type',
                        reference: null,
                        accountsPostings: []
                    };
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should not throw action reference type undefined', (done) => {
                try {
                    newPredictedAction.action = {
                        type: 'type',
                        reference: undefined,
                        ruleAdditionalFields: [],
                        accountsPostings: []
                    };
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should not throw action with accountsPostings empty array', (done) => {
                try {
                    newPredictedAction.action = {
                        type: 'type',
                        reference: 'reference',
                        ruleAdditionalFields: [],
                        accountsPostings: []
                    };
                    PredictedAction.validate(newPredictedAction);
                    done();
                    } catch (err) {
                        done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw action with accountsPostings numeric', (done) => {
                try {
                    newPredictedAction.action = {
                        type: 'type',
                        reference: 'reference',
                        accountsPostings: 1
                    };
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw action with accountsPostings object', (done) => {
                try {
                    newPredictedAction.action = {
                        type: 'type',
                        reference: 'reference',
                        accountsPostings: {}
                    };
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw action with accountsPostings null', (done) => {
                try {
                    newPredictedAction.action = {
                        type: 'type',
                        reference: 'reference',
                        accountsPostings: null
                    };
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw action with accountsPostings undefined', (done) => {
                try {
                    newPredictedAction.action = {
                        type: 'type',
                        reference: 'reference',
                        accountsPostings: undefined
                    };
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });
        });

        describe('predictedaction.action.accountsPostings', (done) => {

            beforeEach(() => {
                newPredictedAction.action.accountsPostings[0] = {
                    accountantNarrative: 'narr',
                    createdBy: 'GP',
                    grossAmount: 120,
                    netAmount: 100,
                    taxAmount: 20,
                    postingInstructions: []
                };
            });

            it('should not throw accountsPostings with createdBy string', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].createdBy = 'AA';
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw accountsPostings with createdBy numeric', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].createdBy = 1;
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw accountsPostings with createdBy object', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].createdBy = {};
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw accountsPostings with createdBy null', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].createdBy = null;
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should not throw accountsPostings with createdBy undefined', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].createdBy = undefined;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should not throw accountsPostings with grossAmount numeric', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].grossAmount = 1;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw accountsPostings with grossAmount string', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].grossAmount = 'aa';
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw accountsPostings with grossAmount object', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].grossAmount = {};
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw accountsPostings with grossAmount null', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].grossAmount = null;
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should not throw accountsPostings with grossAmount undefined', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].grossAmount = undefined;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });


            it('should not throw accountsPostings with netAmount numeric', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].netAmount = 1;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw accountsPostings with netAmount string', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].netAmount = 'aa';
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw accountsPostings with netAmount object', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].netAmount = {};
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw accountsPostings with netAmount null', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].netAmount = null;
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should not throw accountsPostings with netAmount undefined', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].netAmount = undefined;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should not throw accountsPostings with taxAmount numeric', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].taxAmount = 1;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw accountsPostings with taxAmount string', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].taxAmount = 'aa';
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw accountsPostings with taxAmount object', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].taxAmount = {};
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw accountsPostings with taxAmount null', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].taxAmount = null;
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should not throw accountsPostings with taxAmount undefined', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].taxAmount = undefined;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });


            it('should not throw accountsPostings with accountantNarrative string', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].accountantNarrative = 'AA';
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw accountsPostings with accountantNarrative numeric', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].accountantNarrative = 1;
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw accountsPostings with accountantNarrative object', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].accountantNarrative = {};
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should not throw accountsPostings with accountantNarrative null', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].accountantNarrative = null;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should not throw accountsPostings with accountantNarrative undefined', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].accountantNarrative = undefined;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

        });

        describe('predictedaction.action.accountsPostings.postingInstructions', (done) => {

            beforeEach(() => {
                newPredictedAction.action.accountsPostings[0].postingInstructions[0] = {
                    type: 'supplier',
                    code: 'SUPP1',
                    name: 'SAINSBURYS PLC',
                    status: 'Account on Hold',
                    value: -20.00,
                    description: 'desc',
                }
            });

            it('should not throw postingInstructions with type string', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].type = 'AA';
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw postingInstructions with type numeric', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].type = 1;
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw postingInstructions with type object', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].type = {};
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw postingInstructions with type null', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].type = null;
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw postingInstructions with type undefined', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].type = undefined;
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should not throw postingInstructions with userDefinedTypeName string', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].userDefinedTypeName = 'AA';
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw postingInstructions with userDefinedTypeName numeric', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].userDefinedTypeName = 1;
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw postingInstructions with userDefinedTypeName object', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].userDefinedTypeName = {};
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should not throw postingInstructions with userDefinedTypeName null', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].userDefinedTypeName = null;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should not throw postingInstructions with userDefinedTypeName undefined', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].userDefinedTypeName = undefined;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });


            it('should not throw postingInstructions with code string', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].code = 'AA';
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw postingInstructions with code numeric', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].code = 1;
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw postingInstructions with code object', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].code = {};
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should not throw postingInstructions with code null', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].code = null;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should not throw postingInstructions with code undefined', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].code = undefined;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });


            it('should not throw postingInstructions with name string', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].name = 'AA';
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw postingInstructions with name numeric', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].name = 1;
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw postingInstructions with name object', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].name = {};
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should not throw postingInstructions with name null', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].name = null;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should not throw postingInstructions with name undefined', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].name = undefined;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should not throw postingInstructions with description string', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].description = 'AA';
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw postingInstructions with description numeric', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].description = 1;
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw postingInstructions with description object', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].description = {};
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should not throw postingInstructions with description null', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].description = null;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should not throw postingInstructions with description undefined', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].description = undefined;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });


            it('should not throw postingInstructions with status string', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].status = 'AA';
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw postingInstructions with status numeric', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].status = 1;
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw postingInstructions with status object', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].status = {};
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should not throw postingInstructions with status null', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].status = null;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should not throw postingInstructions with status undefined', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].status = undefined;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should not throw postingInstructions with value numeric', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].value = 1;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should throw postingInstructions with value string', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].value = 'AA';
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should throw postingInstructions with value object', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].value = {};
                    PredictedAction.validate(newPredictedAction);

                    done(new Error('should have thrown'));
                } catch (err) {
                    err.should.be.instanceOf(StatusCodeError);
                    err.statusCode.should.eql(400);
                    err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);

                    done();
                }
            });

            it('should not throw postingInstructions with value null', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].value = null;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });

            it('should not throw postingInstructions with value undefined', (done) => {
                try {
                    newPredictedAction.action.accountsPostings[0].postingInstructions[0].value = undefined;
                    PredictedAction.validate(newPredictedAction);
                    done();
                } catch (err) {
                    done((err instanceof Error) ? err : new Error());
                }
            });
        });

        it('should not throw for valid data', function (done) {
            try {
                PredictedAction.validate(newPredictedAction);
                done();
            } catch (err) {
                done((err instanceof Error) ? err : new Error());
            }
        });

        it('should throw if PredictedAction is undefined', function (done) {
            try {
                PredictedAction.validate(undefined);

                done(new Error('should have thrown'));
            } catch (err) {
                err.should.be.instanceOf(StatusCodeError);
                err.statusCode.should.eql(400);
                err.items[0].applicationCode.should.eql(resources.services.common.InvalidType);

                done();
            }
        });

        it('should throw if PredictedAction is null', function (done) {
            try {
                PredictedAction.validate(null);

                done(new Error('should have thrown'));
            } catch (err) {

                err.should.be.instanceof(StatusCodeError);
                err.statusCode.should.eql(400);
                err.items[0].applicationCode.should.eql(resources.services.common.InvalidType);

                done();
            }
        });

        it('should throw if PredictedAction is not an instance of PredictedAction', function (done) {
            try {
                PredictedAction.validate({});

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
                newPredictedAction.predictionId = 'invalid';
                newPredictedAction.source = 'invalid';

                PredictedAction.validate(newPredictedAction);

                done(new Error('should have thrown'));
            } catch (err) {

                err.should.be.instanceOf(StatusCodeError);
                err.statusCode.should.eql(400);
                err.items.length.should.eql(2);

                err.items[0].applicationCode.should.eql(resources.services.common.InvalidProperties);
                err.items[0].params.should.eql({predictionId: 'invalid'});
                err.items[1].applicationCode.should.eql(resources.services.common.InvalidProperties);
                err.items[1].params.should.eql({source: 'invalid'});

                done();
            }
        });

        it('should not throw on validation if noThrow is specified', function (done) {
            try {
                newPredictedAction.predictionId = 'invalid';
                newPredictedAction.source = 'invalid';

                var items = PredictedAction.validate(newPredictedAction, true);

                should(items).be.an.Array().of.length(2);
                should(items[0].applicationCode).eql(resources.services.common.InvalidProperties);
                should(items[0].params).eql({predictionId: 'invalid'});
                should(items[1].applicationCode).eql(resources.services.common.InvalidProperties);
                should(items[1].params).eql({source: 'invalid'});

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        })
    });
});