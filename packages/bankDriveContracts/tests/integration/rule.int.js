const should = require('should');
const sinon = require('sinon');
const _ = require('underscore');
const Rule = require('../../Rule');
const StatusCodeError = require('../../_bankDrive/StatusCodeError');
const StatusCodeErrorItem = require('../../_bankDrive/StatusCodeErrorItem');
const resources = require('../../_bankDrive/resources');

describe ('Rule', () => {

    const validRule = {
        "uuid": "55111111-ba11-ba11-ba11-111111111111",
        "targetType": "Transaction",
        "status": "active",
        "ruleName": "New rule 12",
        "ruleRank": 1,
        "ruleType": "Accountant",
        "productId": "35e1bc00-7183-408f-b363-a3a8eaeb2162",
        "globalRuleId": null,
        "ruleConditions": [
            {
                "ruleField": "transactionNarrative",
                "ruleOperation": "contains",
                "ruleCriteria": "10"
            },
            {
                "ruleField": "currency",
                "ruleOperation": "eq",
                "ruleCriteria": "20"
            }
        ],
        "ruleActions": [
            {
                "splitAmount": 10,
                "accountantNarrative": "New rule narrative",
                "accountsPostings": [
                    {
                        "type": "customer",
                        "code": "CUST1"
                    }
                ]
            }
        ],
        "ruleCounts": {
            "applied": 0,
            "fail": 1,
            "success": 0
        }
    };

    it('Should return a rule when Create is called', (done) => {
        try {
            const rule = Rule.Create();
            should(rule).be.instanceOf(Rule);
            done();
        } catch (err) {
            done((err instanceof Error) ? err : new Error(err));
        }
    });

    it('should throw an error if an invalid rule is provided', (done) => {
        try {
            Rule.validate('bob');
            done(new Error('should have thrown'));
        } catch (err) {
            err.should.be.instanceOf(StatusCodeError);
            err.statusCode.should.eql(400);
            err.items[0].applicationCode.should.eql(resources.services.common.InvalidType);
            err.items[0].message.should.eql('Expected object of type: Rule')
            done();
        }
    });

    it('should not throw an error if valid rule is provided', (done) => {
        try {
            const rule = Rule.Create(validRule);
            rule.validate();
            done();
        } catch (err) {
            done((err instanceof Error) ? err : new Error(err));
        }
    });

    it('should throw an error if rule has no ruleName', (done) => {
        try {
            const copyRule = JSON.parse(JSON.stringify(validRule));
            delete copyRule.ruleName;
            const rule = Rule.Create(copyRule);
            rule.validate();
            done(new Error('should have thrown'));
        } catch (err) {
            should(err).be.instanceOf(StatusCodeError);
            should(err.statusCode).eql(400);
            should(err.items[0].applicationCode).eql(resources.services.common.InvalidProperties);
            should(err.items[0].message).eql('Rule.instance: undefined');
            done();
        }
    });

});