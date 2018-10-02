const Promise = require('bluebird');
const should = require('should');
const _ = require('underscore');
const DB =  require('internal-services-db');
const DbQueries = require('../../lib/DbQueries');
const Rule = require('internal-contracts-rule').Rule;
const RuleBucket = require('internal-contracts-rule').RuleBucket;

describe('machineLearning-actualActionsProcessor',() => {
    let db;
    let dbConnection;
    let queries;
    let params;

    before(()=>{
        params = {
            'rules.maxNumberOfUserRules': '300',
            'rules.maxNumberOfFeedbackRules': '300',
            'rules.maxNumberOfGlobalRules': '300'
        };
        db = new DB({ localhost: true, db: 'machineLearning'});
        return db.connect()
            .then((result) => {
                dbConnection = result;
                queries = new DbQueries(dbConnection, params);
            })
    });

    after(()=> {
        return Promise.resolve(undefined)
            .then(() => {
                const connection = db.getConnection();
                if(connection) {
                    return connection.dropDatabase();
                }
            })
            .then(() => db.disconnect());
    });

    afterEach(()=>{
        return dropCollection('Transaction').then(()=>{
            return dropCollection('Rule').then(()=> {
                return dropCollection('NarrativeDictionary');
            })
        });
    });

    beforeEach(()=>{
        return dropCollection('Transaction').then(()=>{
            return dropCollection('Rule').then(()=> {
                return dropCollection('NarrativeDictionary');
            })
        });
    });

    describe('getTransactions', () => {
        it('Should return relevant properties on transactions across multiple buckets', () => {
            const testTransactions = require('./data/transactions.json');
            return dbConnection.collection('Transaction').insertMany(testTransactions)
                .then(()=>{
                    const bankAccountId = 'ee905d97-5922-6ddc-33b9-5a83ed280670';
                    return queries.getTransactions(bankAccountId,[1,5,6,7])
                        .then((result)=>{
                            should(result.length).eql(4);
                            should(result[0].transactionAmount).eql(1000);
                            should(result[1].transactionAmount).eql(500);
                            should(result[2].transactionAmount).eql(600);
                            should(result[3].transactionAmount).eql(700);
                        })
                });
        })
    });

    describe('getRuleBucket', () => {
        it('Should return the requested bucket', () => {
            const testRules = require('./data/rules.json');
            return dbConnection.collection('Rule').insertMany(testRules).then(() => {
                return queries.getRuleBucket('96616525-c5a3-4958-b1ee-fb856fd83403','5c94f4b7-bf84-418f-a6c6-a26349034a81').then((result) => {
                    should(result.rules.length).eql(1);
                    should(result.rules[0].uuid).eql('cb5e2c41-f3b8-4a8c-9d9c-12c8db9ab12c');
                    should.exist(result.etag);
                    should(result.etag).not.eql(1535546756592.0);

                    const bucket = new RuleBucket(result);
                    bucket.validate();
                })    
            })
        });

        it('Should create a new bucket if does not exist', () =>{
            const testRules = require('./data/rules.json');
            return dbConnection.collection('Rule').insertMany(testRules).then(() => {
                return queries.getRuleBucket('d64c62df-2f23-49d1-aa35-d3b60a1945a5','8e286041-53bb-485a-9cc4-8178098e9252').then((result) => {    
                    should(result.organisationId).eql('d64c62df-2f23-49d1-aa35-d3b60a1945a5');
                    should(result.bankAccountId).eql('8e286041-53bb-485a-9cc4-8178098e9252');
                    should(result.rules.length).eql(0);
                    should.exist(result.etag);
                
                    const bucket = new RuleBucket(result);
                    bucket.validate();
                })    
            })

        })
    });

    describe('addFeedbackRule', () => {
        it('should add a feedback rule to an empty bucket.', () => {
            const newRule = new Rule();
            newRule.ruleName = 'integrationTestRule1';
            newRule.targetType = 'Transaction';
            newRule.status = 'active';
            newRule.ruleConditions = [];
            newRule.ruleActions = [];

            return queries.addFeedbackRule('d64c62df-2f23-49d1-aa35-d3b60a1945a5', '8e286041-53bb-485a-9cc4-8178098e9252', newRule).then(() => {
                return queries.getRuleBucket('d64c62df-2f23-49d1-aa35-d3b60a1945a5', '8e286041-53bb-485a-9cc4-8178098e9252').then((bucket) => {
                    should(bucket.rules.length).eql(1);
                    should(bucket.rules[0].ruleName).eql('integrationTestRule1');
                });
            });
        });

        it('should add a feedback rule to an existing bucket.', () => {
            const newRule = new Rule();
            newRule.ruleName = 'integrationTestRule2';
            newRule.targetType = 'Transaction';
            newRule.status = 'active';
            newRule.ruleConditions = [];
            newRule.ruleActions = [];
            newRule.ruleType = 'Feedback';

            const testRules = require('./data/rules.json');
            return dbConnection.collection('Rule').insertMany(testRules).then(() => {
                return queries.addFeedbackRule('96616525-c5a3-4958-b1ee-fb856fd83403', '5c94f4b7-bf84-418f-a6c6-a26349034a81', newRule)
            }).then(() => {
                return queries.getRuleBucket('96616525-c5a3-4958-b1ee-fb856fd83403', '5c94f4b7-bf84-418f-a6c6-a26349034a81').then((bucket) => {
                    should(bucket.rules.length).eql(2);
                    should(bucket.rules[0].ruleName).eql('fred');
                    should(bucket.rules[1].ruleName).eql('integrationTestRule2');
                });
            })
        });

        it('should not add a feedback rule to a bucket that has max feedback rules.', () => {
            const newRule = new Rule();
            newRule.ruleName = 'integrationTestRule2';
            newRule.targetType = 'Transaction';
            newRule.status = 'active';
            newRule.ruleConditions = [];
            newRule.ruleActions = [];
            newRule.ruleType = 'Feedback';

            const testRules = require('./data/rulesMax.json');
            return dbConnection.collection('Rule').insertMany(testRules).then(() => {
                return queries.addFeedbackRule('e09c1bbc-75d4-425a-8913-754f64f08524', 'ee905d97-5922-6ddc-33b9-5a83ed280670', newRule)
                    .catch((err) => {
                        should(err.message).eql('Feedback rules limit exceeded');
                    })
            })
                .then(() => {
                    return queries.getRuleBucket('e09c1bbc-75d4-425a-8913-754f64f08524', 'ee905d97-5922-6ddc-33b9-5a83ed280670').then((bucket) => {
                        should(bucket.rules.length).eql(300);
                    });
                })
        });

        // FR03 if it can add 2 and update the counts via the addFeedbackRule it can add 300
        it('should add up to 300 feedback rules to the clients rule bucket and increment the rules count accordingly', () => {

            const createRule = (ruleNum) => {
                const newRule = new Rule();
                const ruleName = 'integrationTestRule';
                newRule.targetType = 'Transaction';
                newRule.status = 'active';
                newRule.ruleConditions = [{
                    "ruleField": "transactionAmount",
                    "ruleOperation": "gt",
                    "ruleCriteria": `${ruleNum}`
                }];
                newRule.ruleActions = [];
                newRule.ruleName = `${ruleName}${ruleNum}`;
                newRule.ruleRank = ruleNum;
                return newRule;
            };

            let newRule = createRule(1);
            return queries.addFeedbackRule('d64c62df-2f23-49d1-aa35-d3b60a1945a5', '8e286041-53bb-485a-9cc4-8178098e9252', newRule)
                .then(() => {
                    newRule = createRule(2);
                    return queries.addFeedbackRule('d64c62df-2f23-49d1-aa35-d3b60a1945a5', '8e286041-53bb-485a-9cc4-8178098e9252', newRule)
                })
                .then(() => {
                    return queries.getRuleBucket('d64c62df-2f23-49d1-aa35-d3b60a1945a5', '8e286041-53bb-485a-9cc4-8178098e9252').then((bucket) => {
                        should(bucket.rules.length).eql(2);
                        should(bucket.numberOfRules).eql(2);
                        should(bucket.numberOfUserRules).eql(0);
                        should(bucket.numberOfFeedbackRules).eql(2);
                        should(bucket.numberOfGlobalRules).eql(0);
                    })
                });
        });
    });

    describe('getNarrativeDictionary', () => {
        it('should return a narrative dictionary for a country code', () => {
            const testDictionaries = require('./data/narrativeDictionary.json');
            return dbConnection.collection('NarrativeDictionary').insertMany(testDictionaries).then(() => {
                return queries.getNarrativeDictionary('GBR').then((dictionaryEntry) => {
                    should(dictionaryEntry.countryCode).eql('GBR');
                    should(dictionaryEntry.data.length).eql(27320);
                })
            }); 
        });

        it('should return null when no narrative dictionary exists for the country code', () => {
            const testDictionaries = require('./data/narrativeDictionary.json');
            return dbConnection.collection('NarrativeDictionary').insertMany(testDictionaries).then(() => {
                return queries.getNarrativeDictionary('IRL').then((dictionaryEntry) => {
                    should(dictionaryEntry).eql(undefined);
                })
            }); 
        });
    });

    const collectionExists = (name) =>{
        return dbConnection.listCollections().toArray()
            .then((collections)=> _.find(collections, (collection) => collection.name === name ));
    };

    const dropCollection = (name) =>{
        return collectionExists(name)
            .then((exists) => {
                if (exists) {
                    return dbConnection.collection(name).drop();
                }
            })
    }
});




