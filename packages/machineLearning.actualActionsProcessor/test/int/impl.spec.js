const Promise = require('bluebird');
const should = require('should');
const _ = require('underscore');
const DB =  require('internal-services-db');
const impl = require('./../../lib/impl.js');

describe('machine-learning-actual-actions-processor', function(){  //TEMP:RJ:TESTMATRIX:FR8,FR12,FR14
    let db;
    let dbConnection;

    before(()=>{
        db = new DB({ localhost: true, db:'bank_db' });
        return db.connect()
            .then((result) => {
                dbConnection = result;
            })
    });

    after(()=> {
        return Promise.resolve(undefined)
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

    it('should create a feedback rule when the narrative was found in the dictionary', () => {  //TEMP:RJ:TESTMATRIX:FR08,FR12,FR13
        const testDictionaries = require('./data/narrativeDictionary.json');
        const testTransactions = require('./data/transactions.json');
        return dbConnection.collection('Transaction').insertMany(testTransactions)
            .then(() => dbConnection.collection('NarrativeDictionary').insertMany(testDictionaries))
            .then(()=>{
                const logFunc = (data) => {console.log(JSON.stringify(data))};
                
                let notification = {orgId:'e09c1bbc-75d4-425a-8913-754f64f08524', baId:'ee905d97-5922-6ddc-33b9-5a83ed280670', trId:1, region:'GBR'};
                let bodyString = JSON.stringify({"Message": JSON.stringify(notification)});
                let event = { logger: { info: logFunc, error: logFunc }, Records: [{body: bodyString }]};
                let services = { db};
                let params = {};
                
                return impl.run(event, params, services);
            })
            .then(() => {  // check rule created
                return dbConnection.collection('Rule').findOne({})
                    .then((ruleBucket)=> {

                        should(ruleBucket.rules).match(
                            [{
                                "uuid" : /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
                                "ruleName" : "Feedback Rule: ACADEMY LEASING",
                                "ruleRank" : 1,
                                "ruleConditions" : [ 
                                    {
                                        "ruleField" : "transactionNarrative",
                                        "ruleOperation" : "containsWords",
                                        "ruleCriteria" : "ACADEMY LEASING"
                                    }
                                ],
                                "ruleActions" : [ 
                                    {
                                        "splitPercentage" : 20,
                                        "accountantNarrative" : "narrative",
                                        "accountsPostings" : [ 
                                            {
                                                "type" : "supplier",
                                                "code" : "SUPP2"
                                            }
                                        ]
                                    }, 
                                    {
                                        "splitPercentage" : 50,
                                        "accountantNarrative" : "narrative",
                                        "accountsPostings" : [ 
                                            {
                                                "type" : "supplier",
                                                "code" : "SUPP1"
                                            }
                                        ]
                                    }, 
                                    {
                                        "splitPercentage" : 100,
                                        "accountantNarrative" : "narrative",
                                        "accountsPostings" : [ 
                                            {
                                                "type" : "supplier",
                                                "code" : "SUPP3"
                                            }
                                        ]
                                    }
                                ],
                                "status" : "active",
                                "targetType" : "Transaction",
                                "ruleType" : "Feedback",
                                "productId" : null,
                                "globalRuleId" : null,
                                "ruleCounts" : {
                                    "success" : 0,
                                    "fail" : 1,
                                    "applied" : 0
                                }
                            }]
                        );
                    })
            })
    });
    
    it('should not create a feedback rule if one already exists for the narrative match',()=>{ //TEMP:RJ:TESTMATRIX:FR06
        const testDictionaries = require('./data/narrativeDictionary.json');
        const testTransactions = require('./data/transactions.json');
        return dbConnection.collection('Transaction').insertMany(testTransactions)
            .then(() => dbConnection.collection('NarrativeDictionary').insertMany(testDictionaries))
            .then(()=>{
                const logFunc = (data) => {console.log(JSON.stringify(data))};
                
                let notification = {orgId:'e09c1bbc-75d4-425a-8913-754f64f08524', baId:'ee905d97-5922-6ddc-33b9-5a83ed280670', trId:1, region:'GBR'};
                let bodyString = JSON.stringify({"Message": JSON.stringify(notification)});
                let event = { logger: { info: logFunc, error: logFunc }, Records: [{body: bodyString }]};
                let services = { db};
                let params = {};
                
                return impl.run(event, params, services)
                    .then(() => impl.run(event, params, services));
            })
            .then(() => {  // check rule created
                return dbConnection.collection('Rule').findOne({})
                    .then((ruleBucket)=> {

                        console.log('***here!',ruleBucket);

                        should(ruleBucket.rules).match(
                            [{
                                "uuid" : /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
                                "ruleName" : "Feedback Rule: ACADEMY LEASING",
                                "ruleRank" : 1,
                                "ruleConditions" : [ 
                                    {
                                        "ruleField" : "transactionNarrative",
                                        "ruleOperation" : "containsWords",
                                        "ruleCriteria" : "ACADEMY LEASING"
                                    }
                                ],
                                "ruleActions" : [ 
                                    {
                                        "splitPercentage" : 20,
                                        "accountantNarrative" : "narrative",
                                        "accountsPostings" : [ 
                                            {
                                                "type" : "supplier",
                                                "code" : "SUPP2"
                                            }
                                        ]
                                    }, 
                                    {
                                        "splitPercentage" : 50,
                                        "accountantNarrative" : "narrative",
                                        "accountsPostings" : [ 
                                            {
                                                "type" : "supplier",
                                                "code" : "SUPP1"
                                            }
                                        ]
                                    }, 
                                    {
                                        "splitPercentage" : 100,
                                        "accountantNarrative" : "narrative",
                                        "accountsPostings" : [ 
                                            {
                                                "type" : "supplier",
                                                "code" : "SUPP3"
                                            }
                                        ]
                                    }
                                ],
                                "status" : "active",
                                "targetType" : "Transaction",
                                "ruleType" : "Feedback",
                                "productId" : null,
                                "globalRuleId" : null,
                                "ruleCounts" : {
                                    "success" : 0,
                                    "fail" : 1,
                                    "applied" : 0
                                }
                            }]
                        );
                    })
            })
    });
    
    it('should not create a feedback rule if there is no match with the narrative dictionary',()=>{ //TEMP:RJ:TESTMATRIX:FR04
        const testDictionaries = require('./data/narrativeDictionary.json');
        const testTransactions = require('./data/transactions.json');

        const originalNarrative = testTransactions[0].transactions[0].transactionNarrative;
        testTransactions[0].transactions[0].transactionNarrative = 'RICH';
        return dbConnection.collection('Transaction').insertMany(testTransactions)
            .then(() => dbConnection.collection('NarrativeDictionary').insertMany(testDictionaries))
            .then(()=>{
                const logFunc = (data) => {console.log(JSON.stringify(data))};
                
                let notification = {orgId:'e09c1bbc-75d4-425a-8913-754f64f08524', baId:'ee905d97-5922-6ddc-33b9-5a83ed280670', trId:1, region:'GBR'};
                let bodyString = JSON.stringify({"Message": JSON.stringify(notification)});
                let event = { logger: { info: logFunc, error: logFunc }, Records: [{body: bodyString }]};
                let services = { db};
                let params = {};
                
                return impl.run(event, params, services);
            })
            .then(() => {  // check rule created
                return dbConnection.collection('Rule').findOne({})
                    .then((ruleBucket)=> {
                        should(ruleBucket).eql(null);
                    });
            })
            .then(() => {
                testTransactions[0].transactions[0].transactionNarrative = originalNarrative;
            })
    });

    it('should not create a feedback rule if there is no dictionary for the country',()=>{ //TEMP:RJ:TESTMATRIX:FR05
        const testDictionaries = require('./data/narrativeDictionary.json');
        const testTransactions = require('./data/transactions.json');
        return dbConnection.collection('Transaction').insertMany(testTransactions)
            .then(() => dbConnection.collection('NarrativeDictionary').insertMany(testDictionaries))
            .then(()=>{
                const logFunc = (data) => {console.log(JSON.stringify(data))};
                
                let notification = {orgId:'e09c1bbc-75d4-425a-8913-754f64f08524', baId:'ee905d97-5922-6ddc-33b9-5a83ed280670', trId:1, region:'AUS'};
                let bodyString = JSON.stringify({"Message": JSON.stringify(notification)});
                let event = { logger: { info: logFunc, error: logFunc }, Records: [{body: bodyString }]};
                let services = { db};
                let params = {};
                
                return impl.run(event, params, services)
                    .then(() => impl.run(event, params, services));
            })
            .then(() => {  // check rule created
                return dbConnection.collection('Rule').findOne({})
                    .then((ruleBucket)=> {
                        should(ruleBucket).eql(null);
                    });
            })
    });

    it('should log an error to sumo if adding a feedback rule would create more than 300 feedback rules, and the rule should not be created and no counts incremented', () => {
        const testDictionaries = require('./data/narrativeDictionary.json');
        const testTransactions = require('./data/transactions.json');
        const testRules = require('./data/rulesMax.json');
        const logs = [];
        const expected = {
            function: 'feedbackRuleGenerator.processTransactionImpl',
            log: 'Continuing - Failed to process transaction',
            err: 'Feedback rules limit exceeded'
        };

        return dbConnection.collection('Rule').insertMany(testRules)
            .then(() => dbConnection.collection('Transaction').insertMany(testTransactions))
            .then(() => dbConnection.collection('NarrativeDictionary').insertMany(testDictionaries))
            .then(()=>{
                const logFunc = (data) => {logs.push(data)};

                let notification = {orgId:'e09c1bbc-75d4-425a-8913-754f64f08524', baId:'ee905d97-5922-6ddc-33b9-5a83ed280670', trId:1, region:'GBR'};
                let bodyString = JSON.stringify({"Message": JSON.stringify(notification)});
                let event = { logger: { info: logFunc, error: logFunc }, Records: [{body: bodyString }]};
                let services = { db };
                const params = {
                    'rules.maxNumberOfUserRules': '300',
                    'rules.maxNumberOfFeedbackRules': '300',
                    'rules.maxNumberOfGlobalRules': '300'
                };

                return impl.run(event, params, services);
            })
            .then(() => {  // check log create
                const found = logs.find(l => l.err === 'Feedback rules limit exceeded');
                should(found).eql(expected);
            })
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

