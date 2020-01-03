'use strict';

const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-common-statuscodeerror');
const PredictedAction = require('../../lib/PredictedAction');

const uuid = require('uuid');
const should = require('should');
const sinon = require('sinon');
const _ = require('underscore');

describe('@sage/bc-contracts-predictedaction.PredictedAction', function () {
    let sandbox;
    let data;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('contract.PredictedAction', () => {
        beforeEach(() => {
            data = {
                predictionId: 'dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc',
                rules: [ { ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc', ruleRank: 1, match: 'full' } ],
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
        });

        describe('constructor', () => {
            it('should create an instance of PredictedAction', () => {
                const uut = new PredictedAction();
                should(uut).be.instanceof(PredictedAction);
            });

            it('should ensure the contract is not modified without tests breaking', () => {
                const expected = [
                    'action', 'predictionId', 'rules', 'score', 'source'
                ].sort();
                const actual = Object.keys(new PredictedAction({})).sort();
                should(actual).eql(expected);
            });

            it('should assign properties', () => {
                const uut = new PredictedAction(data);

                should(uut.predictionId).eql('dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc');
                should(uut.rules).eql([{ ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc', ruleRank: 1, match: 'full' }]);
                should(uut.score).eql(100);
                should(uut.source).eql('User');
                should(uut.action).eql({
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
                });
            });

            it('should not assign properties not on contract', () => {
                data.junk = 'wahwahwah';
                const uut = new PredictedAction(data);
                should.not.exists(uut.junk);
            });

            it('should assign default properties', () => {
                const uut = new PredictedAction({});
                should(uut.predictionId).eql(null);
                should(uut.rules).eql([]);
                should(uut.score).eql(null);
                should(uut.source).eql(null);
                should(uut.action).eql({
                    type: null,
                    reference: null,
                    ruleAdditionalFields: [],
                    accountsPostings: []
                });
            });
        });

        describe('Create', () => {
            it('should create an instance of PredictedAction', () => {
                const uut = PredictedAction.Create();
                should(uut).be.an.instanceof(PredictedAction);
            });

            it('should should assign properties', () => {
                const uut = PredictedAction.Create(data);

                should(uut.predictionId).eql('dc8c78bc-cff2-43ea-9f5f-f0cc0f4df1dc');
                should(uut.rules).eql([{ ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc', ruleRank: 1, match: 'full' }]);
                should(uut.score).eql(100);
                should(uut.source).eql('User');
                should(uut.action).eql({
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
                });
            });
        });

        describe('CreateForPostingAndRule', () => {
            it('should create a PredictedAction when calling CreateForPostingAndRule for user', () => {
                sandbox.stub(uuid, 'v4').returns('00000000-0000-0000-0000-000000000001');

                const uut = PredictedAction.CreateForPostingsAndRule([], { uuid: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc', ruleRank: 1, ruleType: 'User' });

                should(uut.predictionId).eql('00000000-0000-0000-0000-000000000001');
                should(uut.rules).eql([{ match: 'full', ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc', ruleRank: 1 }]);
                should(uut.score).eql(100);
                should(uut.source).eql('User');
                should(uut.action).eql({
                    accountsPostings: [],
                    ruleAdditionalFields: [],
                    reference: null,
                    type: null
                });
            });

            it('should create a PredictedAction when calling CreateForPostingAndRule for feedback', () => {
                sandbox.stub(uuid, 'v4').returns('00000000-0000-0000-0000-000000000001');

                const uut = PredictedAction.CreateForPostingsAndRule([], {uuid: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc', ruleRank: 1, ruleType: 'Feedback' });

                should(uut.predictionId).eql('00000000-0000-0000-0000-000000000001');
                should(uut.rules).eql([{ match: 'full', ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc', ruleRank: 1 }]);
                should(uut.score).eql(0);
                should(uut.source).eql('Feedback');
                should(uut.action).eql({
                    accountsPostings: [],
                    ruleAdditionalFields: [],
                    reference: null,
                    type: null
                });
            });
        });

        describe('PredictedAction.prototype.validate', () => {
            it('should call PredictedAction.validate', (done) => {
                sandbox.stub(PredictedAction, 'validate');

                try {
                    const uut = new PredictedAction(data);
                    uut.validate();

                    PredictedAction.validate.callCount.should.eql(1);
                    PredictedAction.validate.firstCall.args[0].should.eql(uut);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            });
        });

        describe('PredictedAction.validate', () => {
            let uut;

            beforeEach(() => {
                uut = new PredictedAction(data);
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

            describe('predictionId', () => {
                it('should NOT throw if valid', (done) => {
                    try {
                        shouldT(() => PredictedAction.validate(substitute(uut, 'predictionId', '00000000-0000-0000-0000-000000000000'))).not.throw();
                        shouldT(() => PredictedAction.validate(substitute(uut, 'predictionId', undefined))).not.throw();
                        shouldT(() => PredictedAction.validate(substitute(uut, 'predictionId', null))).not.throw();

                        done();
                    } catch(err) {
                        console.log(err);
                        done(err);
                    }
                });

                it('should throw if invalid', (done) => {
                    try {
                        const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.predictionId: ${value}`, { predictionId: value })], 400));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'predictionId', ''))).throw(expected(''));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'predictionId', 'not-a-uuid'))).throw(expected('not-a-uuid'));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'predictionId', 9))).throw(expected(9));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'predictionId', {}))).throw(expected({}));

                        done();
                    } catch(err) {
                        done(err);
                    }
                });
            });

            describe('score', () => {
                it('should NOT throw if valid', (done) => {
                    try {
                        shouldT(() => PredictedAction.validate(substitute(uut, 'score', 9))).not.throw();
                        shouldT(() => PredictedAction.validate(substitute(uut, 'score', undefined))).not.throw();
                        shouldT(() => PredictedAction.validate(substitute(uut, 'score', null))).not.throw();

                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                it('should throw if invalid', (done) => {
                    try {
                        const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.score: ${value}`, { score: value })], 400));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'score', ''))).throw(expected(''));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'score', 'random_string'))).throw(expected('random_string'));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'score', {}))).throw(expected({}));

                        done();
                    } catch(err) {
                        done(err);
                    }
                });
            });

            describe('source', () => {
                it('should NOT throw if valid', (done) => {
                    try {
                        shouldT(() => PredictedAction.validate(substitute(uut, 'source', 'Accountant'))).not.throw();
                        shouldT(() => PredictedAction.validate(substitute(uut, 'source', undefined))).not.throw();
                        shouldT(() => PredictedAction.validate(substitute(uut, 'source', null))).not.throw();

                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                it('should throw if invalid', (done) => {
                    try {
                        const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.source: ${value}`, { source: value })], 400));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'source', ''))).throw(expected(''));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'source', 'random_string'))).throw(expected('random_string'));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'source', 9))).throw(expected(9));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'source', {}))).throw(expected({}));

                        done();
                    } catch(err) {
                        done(err);
                    }
                });
            });

            describe('rules', () => {
                it('should NOT throw when valid', (done) => {
                    try {
                        shouldT(() => PredictedAction.validate(substitute(uut, 'rules', [ { ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc', ruleRank: 1, match: 'full' } ]))).not.throw();
                        shouldT(() => PredictedAction.validate(substitute(uut, 'rules', []))).not.throw();

                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                it('should throw when invalid', (done) => {
                    try {
                        const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.rules: should be an array`, { rules: value })], 400));

                        shouldT(() => PredictedAction.validate(substitute(uut, 'rules', undefined))).throw(expected(undefined));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'rules', null))).throw(expected(null));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'rules', 'some_string'))).throw(expected('some_string'));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'rules', ''))).throw(expected(''));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'rules', 9))).throw(expected(9));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'rules', {}))).throw(expected({}));

                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                describe('ruleId', () => {
                    it('should not throw when valid', (done) => {
                        try {
                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].ruleId', '00000000-cff2-43ea-9f5f-f0cc0f4df1dc'))).not.throw();
                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].ruleId', undefined))).not.throw();
                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].ruleId', null))).not.throw();

                            done();
                        } catch(err) {
                            done(err);
                        }

                    });

                    it('should throw when invalid', (done) => {
                        try {
                            // TODO: inconsistent
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Object.rules: ${value}`, { rules: value })], 400));

                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].ruleId', 'random_string'))).throw(expected({ ruleId: 'random_string', ruleRank: 1, match: 'full' }));
                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].ruleId', 9))).throw(expected({ ruleId: 9, ruleRank: 1, match: 'full' }));
                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].ruleId', {}))).throw(expected({ ruleId: {}, ruleRank: 1, match: 'full' }));

                            done();
                        } catch(err) {
                            done(err);
                        }
                    });
                });

                describe('ruleRank', () => {
                    it('should not throw when valid', (done) => {
                        try {
                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].ruleRank', 1))).not.throw();
                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].ruleRank', undefined))).not.throw();
                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].ruleRank', null))).not.throw();

                            done();
                        } catch(err) {
                            done(err);
                        }

                    });

                    it('should throw when invalid', (done) => {
                        try {
                            // TODO: inconsistent
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Object.rules: ${value}`, { rules: value })], 400));

                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].ruleRank', 'random_string'))).throw(expected({ ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc', ruleRank: 'random_string', match: 'full' }));
                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].ruleRank', {}))).throw(expected({ ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc', ruleRank: {}, match: 'full' }));

                            done();
                        } catch(err) {
                            done(err);
                        }
                    });
                });

                describe('match', () => {
                    it('should not throw when valid', (done) => {
                        try {
                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].match', 'full'))).not.throw();
                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].match', 'partial'))).not.throw();
                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].match', 'overwritten'))).not.throw();
                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].match', undefined))).not.throw();
                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].match', null))).not.throw();

                            done();
                        } catch(err) {
                            done(err);
                        }

                    });

                    it('should throw when invalid', (done) => {
                        try {
                            // TODO: inconsistent
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `Object.rules: ${value}`, { rules: value })], 400));

                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].match', 9))).throw(expected({ ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc', ruleRank: 1, match: 9 }));
                            shouldT(() => PredictedAction.validate(substitute(uut, 'rules[0].match', {}))).throw(expected({ ruleId: '00000000-cff2-43ea-9f5f-f0cc0f4df1dc', ruleRank: 1, match: {} }));

                            done();
                        } catch(err) {
                            done(err);
                        }
                    });
                });
            });

            describe('action', () => {
                it('should NOT throw when valid', (done) => {
                    try {
                        shouldT(() => PredictedAction.validate(substitute(uut, 'action', { type: 'type', reference: 'reference', ruleAdditionalFields: [], accountsPostings: [] }))).not.throw();
                        shouldT(() => PredictedAction.validate(substitute(uut, 'action', undefined))).not.throw();
                        shouldT(() => PredictedAction.validate(substitute(uut, 'action', null))).not.throw();

                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                it('should throw when invalid', (done) => {
                    try {
                        const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action: ${value}`, { action: value })], 400));

                        shouldT(() => PredictedAction.validate(substitute(uut, 'action', 'some_string'))).throw(expected('some_string'));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'action', ''))).throw(expected(''));
                        shouldT(() => PredictedAction.validate(substitute(uut, 'action', 9))).throw(expected(9));

                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                describe('type', () => {
                    it('should NOT throw when valid', (done) => {
                        try {
                            shouldT(() => PredictedAction.validate(substitute(uut, 'action.type', 'string'))).not.throw();
                            shouldT(() => PredictedAction.validate(substitute(uut, 'action.type', undefined))).not.throw();
                            shouldT(() => PredictedAction.validate(substitute(uut, 'action.type', null))).not.throw();

                            done();
                        } catch(err) {
                            done(err);
                        }
                    });

                    it('should throw when invalid', (done) => {
                        try {
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action.type: ${value}`, { 'action.type': value })], 400));

                            shouldT(() => PredictedAction.validate(substitute(uut, 'action.type', 9))).throw(expected(9));
                            shouldT(() => PredictedAction.validate(substitute(uut, 'action.type', {}))).throw(expected({}));

                            done();
                        } catch(err) {
                            done(err);
                        }
                    });
                });

                describe('reference', () => {
                    it('should NOT throw when valid', (done) => {
                        try {
                            shouldT(() => PredictedAction.validate(substitute(uut, 'action.reference', 'string'))).not.throw();
                            shouldT(() => PredictedAction.validate(substitute(uut, 'action.reference', undefined))).not.throw();
                            shouldT(() => PredictedAction.validate(substitute(uut, 'action.reference', null))).not.throw();

                            done();
                        } catch(err) {
                            done(err);
                        }
                    });

                    it('should throw when invalid', (done) => {
                        try {
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action.reference: ${value}`, { 'action.reference': value })], 400));

                            shouldT(() => PredictedAction.validate(substitute(uut, 'action.reference', 9))).throw(expected(9));
                            shouldT(() => PredictedAction.validate(substitute(uut, 'action.reference', {}))).throw(expected({}));

                            done();
                        } catch(err) {
                            done(err);
                        }
                    });
                });

                describe('accountsPostings', () => {
                    it('should NOT throw when valid', (done) => {
                        try {
                            const valid = {
                                accountantNarrative: 'narr',
                                createdBy: 'GP',
                                grossAmount: 120,
                                netAmount: 100,
                                taxAmount: 20,
                                postingInstructions: []
                            };
                            shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings', []))).not.throw();
                            shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings', [valid]))).not.throw();

                            done();
                        } catch(err) {
                            console.log(err);
                            done(err);
                        }
                    });

                    it('should throw when invalid', (done) => {
                        try {
                            const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action.accountsPostings: ${value}`, { 'action.accountsPostings': value })], 400));

                            shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings', undefined))).throw(expected(undefined));
                            shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings', null))).throw(expected(null));
                            shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings', {}))).throw(expected({}));
                            shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings', 9))).throw(expected(9));

                            done();
                        } catch(err) {
                            done(err);
                        }
                    });

                    describe('createdBy', () => {
                        it('should NOT throw when valid', (done) => {
                            try {
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].createdBy', 'string'))).not.throw();
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].createdBy', undefined))).not.throw();
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].createdBy', null))).not.throw();

                                done();
                            } catch(err) {
                                console.log(err);
                                done(err);
                            }
                        });

                        it('should throw when invalid', (done) => {
                            try {
                                const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action.accountsPostings[0].createdBy: ${value}`, { 'action.accountsPostings[0].createdBy': value })], 400));

                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].createdBy', 9))).throw(expected(9));
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].createdBy', {}))).throw(expected({}));

                                done();
                            } catch(err) {
                                console.log(err);
                                done(err);
                            }
                        });
                    });

                    describe('grossAmount', () => {
                        it('should NOT throw when valid', (done) => {
                            try {
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].grossAmount', 120))).not.throw();
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].grossAmount', undefined))).not.throw();
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].grossAmount', null))).not.throw();

                                done();
                            } catch(err) {
                                console.log(err);
                                done(err);
                            }
                        });

                        it('should throw when invalid', (done) => {
                            try {
                                const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action.accountsPostings[0].grossAmount: ${value}`, { 'action.accountsPostings[0].grossAmount': value })], 400));

                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].grossAmount', 'string'))).throw(expected('string'));
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].grossAmount', {}))).throw(expected({}));

                                done();
                            } catch(err) {
                                console.log(err);
                                done(err);
                            }
                        });
                    });

                    describe('netAmount', () => {
                        it('should NOT throw when valid', (done) => {
                            try {
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].netAmount', 120))).not.throw();
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].netAmount', undefined))).not.throw();
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].netAmount', null))).not.throw();

                                done();
                            } catch(err) {
                                console.log(err);
                                done(err);
                            }
                        });

                        it('should throw when invalid', (done) => {
                            try {
                                const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action.accountsPostings[0].netAmount: ${value}`, { 'action.accountsPostings[0].netAmount': value })], 400));

                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].netAmount', 'string'))).throw(expected('string'));
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].netAmount', {}))).throw(expected({}));

                                done();
                            } catch(err) {
                                console.log(err);
                                done(err);
                            }
                        });
                    });

                    describe('taxAmount', () => {
                        it('should NOT throw when valid', (done) => {
                            try {
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].taxAmount', 120))).not.throw();
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].taxAmount', undefined))).not.throw();
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].taxAmount', null))).not.throw();

                                done();
                            } catch(err) {
                                console.log(err);
                                done(err);
                            }
                        });

                        it('should throw when invalid', (done) => {
                            try {
                                const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action.accountsPostings[0].taxAmount: ${value}`, { 'action.accountsPostings[0].taxAmount': value })], 400));

                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].taxAmount', 'string'))).throw(expected('string'));
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].taxAmount', {}))).throw(expected({}));

                                done();
                            } catch(err) {
                                console.log(err);
                                done(err);
                            }
                        });
                    });

                    describe('accountantNarrative', () => {
                        it('should NOT throw when valid', (done) => {
                            try {
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].accountantNarrative', 'string'))).not.throw();
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].accountantNarrative', undefined))).not.throw();
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].accountantNarrative', null))).not.throw();

                                done();
                            } catch(err) {
                                console.log(err);
                                done(err);
                            }
                        });

                        it('should throw when invalid', (done) => {
                            try {
                                const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action.accountsPostings[0].accountantNarrative: ${value}`, { 'action.accountsPostings[0].accountantNarrative': value })], 400));

                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].accountantNarrative', 120))).throw(expected(120));
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].accountantNarrative', {}))).throw(expected({}));

                                done();
                            } catch(err) {
                                console.log(err);
                                done(err);
                            }
                        });
                    });

                    describe('postingInstructions', () => {
                        it('should NOT throw when valid', (done) => {
                            try {
                                const valid = {
                                    type: 'supplier',
                                    code: 'SUPP1',
                                    name: 'SAINSBURYS PLC',
                                    status: 'Account on Hold',
                                    value: -20.00,
                                    description: 'desc',
                                    userDefinedTypeName: 'typename'
                                };
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions', []))).not.throw();
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions', [valid]))).not.throw();

                                done();
                            } catch(err) {
                                console.log(err);
                                done(err);
                            }
                        });

                        it('should throw when invalid', (done) => {
                            try {
                                const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action.accountsPostings[0].postingInstructions: ${value}`, { 'action.accountsPostings[0].postingInstructions': value })], 400));

                                const valid = { accountantNarrative: 'narr', createdBy: 'GP', grossAmount: 120, netAmount: 100, taxAmount: 20, postingInstructions: [] };
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions', undefined))).throw(expected(undefined));
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions', null))).throw(expected(null));
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions', 9))).throw(expected(9));
                                shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions', 'string'))).throw(expected('string'));

                                done();
                            } catch(err) {
                                done(err);
                            }
                        });

                        describe('type', () => {
                            it('should NOT throw when valid', (done) => {
                                try {
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].type', 'string'))).not.throw();

                                    done();
                                } catch(err) {
                                    console.log(err);
                                    done(err);
                                }
                            });

                            it('should throw when invalid', (done) => {
                                try {
                                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action.accountsPostings[0].postingInstructions[0].type: ${value}`, { 'action.accountsPostings[0].postingInstructions[0].type': value })], 400));
                                    const valid = {
                                        accountantNarrative: 'narr', createdBy: 'GP', grossAmount: 120, netAmount: 100, taxAmount: 20,
                                        postingInstructions: [
                                            { type: 'supplier', code: 'SUPP1', name: 'SAINSBURYS PLC', status: 'Account on Hold', value: -20.00, description: 'desc', userDefinedTypeName: 'typename' }
                                        ]
                                    };
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].type', undefined))).throw(expected(undefined));
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].type', null))).throw(expected(null));
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].type', 9))).throw(expected(9));
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].type', {}))).throw(expected({}));

                                    done();
                                } catch(err) {
                                    console.log(err);
                                    done(err);
                                }
                            });
                        });

                        describe('userDefinedString', () => {
                            it('should NOT throw when valid', (done) => {
                                try {
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].userDefinedTypeName', 'string'))).not.throw();
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].userDefinedTypeName', undefined))).not.throw();
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].userDefinedTypeName', null))).not.throw();

                                    done();
                                } catch(err) {
                                    console.log(err);
                                    done(err);
                                }
                            });

                            it('should throw when invalid', (done) => {
                                try {
                                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action.accountsPostings[0].postingInstructions[0].userDefinedTypeName: ${value}`, { 'action.accountsPostings[0].postingInstructions[0].userDefinedTypeName': value })], 400));
                                    const valid = {
                                        accountantNarrative: 'narr', createdBy: 'GP', grossAmount: 120, netAmount: 100, taxAmount: 20,
                                        postingInstructions: [
                                            { type: 'supplier', code: 'SUPP1', name: 'SAINSBURYS PLC', status: 'Account on Hold', value: -20.00, description: 'desc', userDefinedTypeName: 'typename' }
                                        ]
                                    };

                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].userDefinedTypeName', 9))).throw(expected(9));
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].userDefinedTypeName', {}))).throw(expected({}));

                                    done();
                                } catch(err) {
                                    console.log(err);
                                    done(err);
                                }
                            });
                        });

                        describe('code', () => {
                            it('should NOT throw when valid', (done) => {
                                try {
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].code', 'string'))).not.throw();
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].code', undefined))).not.throw();
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].code', null))).not.throw();

                                    done();
                                } catch(err) {
                                    console.log(err);
                                    done(err);
                                }
                            });

                            it('should throw when invalid', (done) => {
                                try {
                                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action.accountsPostings[0].postingInstructions[0].code: ${value}`, { 'action.accountsPostings[0].postingInstructions[0].code': value })], 400));
                                    const valid = {
                                        accountantNarrative: 'narr', createdBy: 'GP', grossAmount: 120, netAmount: 100, taxAmount: 20,
                                        postingInstructions: [
                                            { type: 'supplier', code: 'SUPP1', name: 'SAINSBURYS PLC', status: 'Account on Hold', value: -20.00, description: 'desc', userDefinedTypeName: 'typename' }
                                        ]
                                    };

                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].code', 9))).throw(expected(9));
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].code', {}))).throw(expected({}));

                                    done();
                                } catch(err) {
                                    console.log(err);
                                    done(err);
                                }
                            });
                        });

                        describe('name', () => {
                            it('should NOT throw when valid', (done) => {
                                try {
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].name', 'string'))).not.throw();
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].name', undefined))).not.throw();
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].name', null))).not.throw();

                                    done();
                                } catch(err) {
                                    console.log(err);
                                    done(err);
                                }
                            });

                            it('should throw when invalid', (done) => {
                                try {
                                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action.accountsPostings[0].postingInstructions[0].name: ${value}`, { 'action.accountsPostings[0].postingInstructions[0].name': value })], 400));
                                    const valid = {
                                        accountantNarrative: 'narr', createdBy: 'GP', grossAmount: 120, netAmount: 100, taxAmount: 20,
                                        postingInstructions: [
                                            { type: 'supplier', code: 'SUPP1', name: 'SAINSBURYS PLC', status: 'Account on Hold', value: -20.00, description: 'desc', userDefinedTypeName: 'typename' }
                                        ]
                                    };

                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].name', 9))).throw(expected(9));
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].name', {}))).throw(expected({}));

                                    done();
                                } catch(err) {
                                    console.log(err);
                                    done(err);
                                }
                            });
                        });

                        describe('description', () => {
                            it('should NOT throw when valid', (done) => {
                                try {
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].description', 'string'))).not.throw();
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].description', undefined))).not.throw();
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].description', null))).not.throw();

                                    done();
                                } catch(err) {
                                    console.log(err);
                                    done(err);
                                }
                            });

                            it('should throw when invalid', (done) => {
                                try {
                                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action.accountsPostings[0].postingInstructions[0].description: ${value}`, { 'action.accountsPostings[0].postingInstructions[0].description': value })], 400));
                                    const valid = {
                                        accountantNarrative: 'narr', createdBy: 'GP', grossAmount: 120, netAmount: 100, taxAmount: 20,
                                        postingInstructions: [
                                            { type: 'supplier', code: 'SUPP1', name: 'SAINSBURYS PLC', status: 'Account on Hold', value: -20.00, description: 'desc', userDefinedTypeName: 'typename' }
                                        ]
                                    };

                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].description', 9))).throw(expected(9));
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].description', {}))).throw(expected({}));

                                    done();
                                } catch(err) {
                                    console.log(err);
                                    done(err);
                                }
                            });
                        });

                        describe('status', () => {
                            it('should NOT throw when valid', (done) => {
                                try {
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].status', 'string'))).not.throw();
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].status', undefined))).not.throw();
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].status', null))).not.throw();

                                    done();
                                } catch(err) {
                                    console.log(err);
                                    done(err);
                                }
                            });

                            it('should throw when invalid', (done) => {
                                try {
                                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action.accountsPostings[0].postingInstructions[0].status: ${value}`, { 'action.accountsPostings[0].postingInstructions[0].status': value })], 400));
                                    const valid = {
                                        accountantNarrative: 'narr', createdBy: 'GP', grossAmount: 120, netAmount: 100, taxAmount: 20,
                                        postingInstructions: [
                                            { type: 'supplier', code: 'SUPP1', name: 'SAINSBURYS PLC', status: 'Account on Hold', value: -20.00, description: 'desc', userDefinedTypeName: 'typename' }
                                        ]
                                    };

                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].status', 9))).throw(expected(9));
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].status', {}))).throw(expected({}));

                                    done();
                                } catch(err) {
                                    console.log(err);
                                    done(err);
                                }
                            });
                        });

                        describe('value', () => {
                            it('should NOT throw when valid', (done) => {
                                try {
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].value', 9))).not.throw();
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].value', undefined))).not.throw();
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].value', null))).not.throw();

                                    done();
                                } catch(err) {
                                    console.log(err);
                                    done(err);
                                }
                            });

                            it('should throw when invalid', (done) => {
                                try {
                                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `PredictedAction.action.accountsPostings[0].postingInstructions[0].value: ${value}`, { 'action.accountsPostings[0].postingInstructions[0].value': value })], 400));
                                    const valid = {
                                        accountantNarrative: 'narr', createdBy: 'GP', grossAmount: 120, netAmount: 100, taxAmount: 20,
                                        postingInstructions: [
                                            { type: 'supplier', code: 'SUPP1', name: 'SAINSBURYS PLC', status: 'Account on Hold', value: -20.00, description: 'desc', userDefinedTypeName: 'typename' }
                                        ]
                                    };

                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].value', 'string'))).throw(expected('string'));
                                    shouldT(() => PredictedAction.validate(substitute(uut, 'action.accountsPostings[0].postingInstructions[0].value', {}))).throw(expected({}));

                                    done();
                                } catch(err) {
                                    console.log(err);
                                    done(err);
                                }
                            });
                        });
                    });
                });
            });

            it('should not throw for valid data', () => {
                PredictedAction.validate(uut);
            });

            it('should throw if PredictedAction is undefined', (done) => {
                try {
                    PredictedAction.validate(undefined);

                    done(new Error('should have thrown'));
                } catch (err) {
                    should(err).eql(new StatusCodeError([new StatusCodeErrorItem('InvalidType', 'Expected object of type: PredictedAction')], 400))

                    done();
                }
            });

            it('should throw if PredictedAction is null', (done) => {
                try {
                    PredictedAction.validate(null);

                    done(new Error('should have thrown'));
                } catch (err) {
                    should(err).eql(new StatusCodeError([new StatusCodeErrorItem('InvalidType', 'Expected object of type: PredictedAction')], 400))

                    done();
                }
            });

            it('should throw if PredictedAction is not an instance of PredictedAction', (done) => {
                try {
                    PredictedAction.validate({});

                    done(new Error('should have thrown'));
                } catch (err) {
                    should(err).eql(new StatusCodeError([new StatusCodeErrorItem('InvalidType', 'Expected object of type: PredictedAction')], 400))

                    done();
                }
            });

            it('should throw multiple error items if multiple fields are invalid', (done) => {
                try {
                    uut.predictionId = 'invalid';
                    uut.source = 'invalid';

                    PredictedAction.validate(uut);

                    done(new Error('should have thrown'));
                } catch (err) {
                    should(err).eql(
                        new StatusCodeError([
                            new StatusCodeErrorItem('InvalidProperties', 'PredictedAction.predictionId: invalid', { predictionId: 'invalid' }),
                            new StatusCodeErrorItem('InvalidProperties', 'PredictedAction.source: invalid', { source: 'invalid' })
                        ], 400)
                    );

                    done();
                }
            });

            it('should not throw on validation if noThrow is specified', (done) => {
                try {
                    uut.predictionId = 'invalid';
                    uut.source = 'invalid';

                    const items = PredictedAction.validate(uut, true);

                    should(items).be.an.Array().of.length(2);
                    should(items).eql([
                        new StatusCodeErrorItem('InvalidProperties', 'PredictedAction.predictionId: invalid', { predictionId: 'invalid' }),
                        new StatusCodeErrorItem('InvalidProperties', 'PredictedAction.source: invalid', { source: 'invalid' })
                    ]);

                    done();
                } catch (err) {
                    done(err instanceof Error ? err : new Error(err));
                }
            })
        });
    })
});
