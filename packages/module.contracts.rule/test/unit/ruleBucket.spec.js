'use strict';

const RuleBucket = require('../../lib/RuleBucket');
const Rule = require('../../lib/Rule');

const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-common-statuscodeerror');

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
            productId: '00000000-0000-0000-0000-000000000001',
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

    it('should create an instance of RuleBucket', (done) => {
        try {
            const uut = new RuleBucket(data);
            uut.should.be.instanceof(RuleBucket);
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should ensure the contract is not modified without tests breaking', () => {
        const expected = [
            'uuid', 'region', 'productId', 'organisationId', 'bankAccountId',
            'isAccountOwnerRules', 'numberOfRules', 'rules'
        ].sort();
        const actual = Object.keys(new RuleBucket({})).sort();
        should(actual).eql(expected);
    });

    it('should assign properties', (done) => {
        try {
            const uut = new RuleBucket(data);
            should(uut.uuid).eql(data.uuid);
            should(uut.region).eql(data.region);
            should(uut.organisationId).eql(data.organisationId);
            should(uut.bankAccountId).eql(data.bankAccountId);
            should(uut.numberOfRules).eql(data.numberOfRules);
            should(uut.rules).eql([new Rule(data.rules[0])]);
            should(uut.isAccountOwnerRules).eql(data.isAccountOwnerRules);
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    it('should not assign properties not on contract', (done) => {
        try {
            data.junk = 'wahwahwah';
            const uut = new RuleBucket(data);
            should.not.exists(uut.junk);
            done();
        } catch (err) {
            done(err instanceof Error ? err : new Error(err));
        }
    });

    describe('RuleBucket.prototype.validate', () => {
        it('should call RuleBucket.validate', (done) => {
            sandbox.stub(RuleBucket, 'validate');

            try {
                const uut = new RuleBucket(data);
                RuleBucket.validate(uut);

                RuleBucket.validate.callCount.should.eql(1);
                RuleBucket.validate.calledWithExactly(uut).should.eql(true);

                done();
            } catch (err) {
                done(err instanceof Error ? err : new Error(err));
            }
        });
    });

    describe('RuleBucket.validate', () => {
        let uut;

        beforeEach(() => {
            uut = new RuleBucket(data);
        });

        it('should validate and throw', (done) => {
            try {
                delete uut.region;
                uut.validate();

                done(new Error('should have thrown'));
            } catch (err) {
                const expected = new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', 'RuleBucket.region: undefined', { region: undefined})], 400);
                should(err).eql(expected);
                done();
            }
        });

        it('should validate and not throw', (done) => {
            try {
                delete uut.region;
                const response = uut.validate(true);
                const expected = [new StatusCodeErrorItem('InvalidProperties', 'RuleBucket.region: undefined', { region: undefined})];
                should(response).eql(expected);

                done();
            } catch (err) {
                console.log(err);
                done(err instanceof Error ? err : new Error(err));
            }
        });

        it('should not throw for valid data', (done) => {
            try {
                RuleBucket.validate(uut);
                done();
            } catch (err) {
                done((err instanceof Error) ? err : new Error());
            }
        });

        it('should throw if ruleBucket is undefined', (done) => {
            try {
                RuleBucket.validate(undefined);
                done(new Error('should have thrown'));
            } catch (err) {
                const expected = new StatusCodeError([
                    new StatusCodeErrorItem('InvalidType', 'Expected object of type: RuleBucket')
                ], 400);
                should(err).be.instanceOf(StatusCodeError);
                should(err).eql(expected);

                done();
            }
        });

        it('should throw if ruleBucket is null', (done) => {
            try {
                RuleBucket.validate(null);
                done(new Error('should have thrown'));
            } catch (err) {
                const expected = new StatusCodeError([
                    new StatusCodeErrorItem('InvalidType', 'Expected object of type: RuleBucket')
                ], 400);
                should(err).be.instanceOf(StatusCodeError);
                should(err).eql(expected);
                done();
            }
        });

        it('should throw if ruleBucket is not an instance of RuleBucket', (done) => {
            try {
                RuleBucket.validate({});

                done(new Error('should have thrown'));
            } catch (err) {
                const expected = new StatusCodeError([
                    new StatusCodeErrorItem('InvalidType', 'Expected object of type: RuleBucket')
                ], 400);
                should(err).be.instanceOf(StatusCodeError);
                should(err).eql(expected);

                done();
            }
        });

        it('should throw multiple error items if multiple fields are invalid', (done) => {
            try {
                uut.uuid = null;
                uut.region = null;

                RuleBucket.validate(uut);

                done(new Error('should have thrown'));
            } catch (err) {
                const expected = new StatusCodeError([
                    new StatusCodeErrorItem('InvalidProperties', 'RuleBucket.uuid: null', {uuid: null}),
                    new StatusCodeErrorItem('InvalidProperties', 'RuleBucket.region: null', {region: null}),
                ], 400);
                should(err).be.instanceOf(StatusCodeError);
                should(err).eql(expected);

                done();
            }
        });

        const substitute = (obj, prop, value) => {
            const splits = prop.split('.');

            let ref = obj;
            _.times(splits.length, (i) => {
                let key = splits[i];
                let match = key.match(/\[(\d*)\]/);
                console.log('key', key);
                console.log('index', match);
                console.log(ref);
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

        describe('uuid', () => {
            it('should NOT throw if uuid valid', (done) => {
                try {
                    shouldT(() => RuleBucket.validate(substitute(uut, 'uuid', '00000000-0000-0000-0000-000000000000'))).not.throw();
                    should(() => RuleBucket.validate(substitute(uut, 'uuid', undefined))).not.throw();

                    done();
                } catch(err) {
                    done(err);
                }
            });

            it('should throw if uuid invalid', (done) => {
                try {
                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `RuleBucket.uuid: ${value}`, { uuid: value })], 400));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'uuid', null))).throw(expected(null));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'uuid', ''))).throw(expected(''));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'uuid', 'not-a-uuid'))).throw(expected('not-a-uuid'));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'uuid', 9))).throw(expected(9));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'uuid', {}))).throw(expected({}));

                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        describe('region', () => {
            it('should NOT throw when valid', (done) => {
                try {
                    shouldT(() => RuleBucket.validate(substitute(uut, 'region', 'GBR'))).not.throw();

                    done();
                } catch(err) {
                    done(err);
                }
            });

            it('should throw when invalid', (done) => {
                try {
                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `RuleBucket.region: ${value}`, { region: value })], 400));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'region', undefined))).throw(expected(undefined));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'region', null))).throw(expected(null));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'region', ''))).throw(expected(''));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'region', 9))).throw(expected(9));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'region', {}))).throw(expected({}));

                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        describe('bankAccountId', () => {
            it('should NOT throw when valid', (done) => {
                try {
                    shouldT(() => RuleBucket.validate(substitute(uut, 'bankAccountId', '00000000-0000-0000-0000-000000000000'))).not.throw();

                    done();
                } catch(err) {
                    done(err);
                }
            });

            it('should throw when invalid', (done) => {
                try {
                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `RuleBucket.bankAccountId: ${value}`, { bankAccountId: value })], 400));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'bankAccountId', undefined))).throw(expected(undefined));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'bankAccountId', null))).throw(expected(null));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'bankAccountId', ''))).throw(expected(''));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'bankAccountId', 9))).throw(expected(9));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'bankAccountId', {}))).throw(expected({}));

                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        describe('organisationId', () => {
            it('should NOT throw when valid', (done) => {
                try {
                    shouldT(() => RuleBucket.validate(substitute(uut, 'organisationId', '00000000-0000-0000-0000-000000000000'))).not.throw();

                    done();
                } catch(err) {
                    done(err);
                }
            });

            it('should throw when invalid', (done) => {
                try {
                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `RuleBucket.organisationId: ${value}`, { organisationId: value })], 400));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'organisationId', undefined))).throw(expected(undefined));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'organisationId', null))).throw(expected(null));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'organisationId', ''))).throw(expected(''));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'organisationId', 9))).throw(expected(9));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'organisationId', {}))).throw(expected({}));

                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        describe('productId', () => {
            it('should NOT throw when valid', (done) => {
                try {
                    shouldT(() => RuleBucket.validate(substitute(uut, 'productId', '00000000-0000-0000-0000-000000000000'))).not.throw();
                    shouldT(() => RuleBucket.validate(substitute(uut, 'productId', undefined))).not.throw();
                    shouldT(() => RuleBucket.validate(substitute(uut, 'productId', null))).not.throw();

                    done();
                } catch(err) {
                    done(err);
                }
            });

            it('should throw when invalid', (done) => {
                try {
                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `RuleBucket.productId: ${value}`, { productId: value })], 400));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'productId', ''))).throw(expected(''));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'productId', 9))).throw(expected(9));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'productId', {}))).throw(expected({}));

                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        describe('isAccountOwnerRules', () => {
            it('should NOT throw when valid', (done) => {
                try {
                    shouldT(() => RuleBucket.validate(substitute(uut, 'isAccountOwnerRules', false))).not.throw();
                    shouldT(() => RuleBucket.validate(substitute(uut, 'isAccountOwnerRules', true))).not.throw();

                    done();
                } catch(err) {
                    done(err);
                }
            });

            it('should throw when invalid', (done) => {
                try {
                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `RuleBucket.isAccountOwnerRules: ${value}`, { isAccountOwnerRules: value })], 400));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'isAccountOwnerRules', undefined))).throw(expected(undefined));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'isAccountOwnerRules', null))).throw(expected(null));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'isAccountOwnerRules', ''))).throw(expected(''));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'isAccountOwnerRules', 9))).throw(expected(9));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'isAccountOwnerRules', {}))).throw(expected({}));

                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        describe('numberOfRules', () => {
            it('should NOT throw when valid', (done) => {
                try {
                    shouldT(() => RuleBucket.validate(substitute(uut, 'numberOfRules', 1))).not.throw();
                    shouldT(() => RuleBucket.validate(substitute(uut, 'numberOfRules', 102))).not.throw();

                    done();
                } catch(err) {
                    done(err);
                }
            });

            it('should throw when invalid', (done) => {
                try {
                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `RuleBucket.numberOfRules: ${value}`, { numberOfRules: value })], 400));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'numberOfRules', undefined))).throw(expected(undefined));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'numberOfRules', null))).throw(expected(null));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'numberOfRules', ''))).throw(expected(''));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'numberOfRules', true))).throw(expected(true));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'numberOfRules', {}))).throw(expected({}));

                    done();
                } catch(err) {
                    done(err);
                }
            });
        });

        describe('rules', () => {
            it('should NOT throw when valid', (done) => {
                try {
                    shouldT(() => RuleBucket.validate(substitute(uut, 'rules', []))).not.throw();

                    done();
                } catch(err) {
                    done(err);
                }
            });

            it('should throw when invalid', (done) => {
                try {
                    const expected = (value) => (new StatusCodeError([new StatusCodeErrorItem('InvalidProperties', `RuleBucket.rules: should be an array`, { rules: value })], 400));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'rules', undefined))).throw(expected(undefined));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'rules', null))).throw(expected(null));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'rules', ''))).throw(expected(''));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'rules', 9))).throw(expected(9));
                    shouldT(() => RuleBucket.validate(substitute(uut, 'rules', {}))).throw(expected({}));

                    done();
                } catch(err) {
                    done(err);
                }
            });
        });
    });
});
