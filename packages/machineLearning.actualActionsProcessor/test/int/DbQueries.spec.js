const should = require('should');
const sinon = require('sinon');
const _ = require('underscore');
const DB =  require('internal-services-db');
const DbQueries = require('../../lib/DbQueries')

describe('machineLearning-actualActionsProcessor',()=>{
    let db;
    let dbConnection;
    let queries;

    before(()=>{
        db = new DB({env:'', region:'', domain:'', username:'', password:'', replicaSet:''});
        db.connectionString = 'mongodb://localhost';
        return db.connect('bank_db')
            .then((result) => {
                dbConnection = result;
                queries = new DbQueries(dbConnection);
            })
    })

    after(()=>{
        return db.disconnect();
    })

    afterEach(()=>{
    /*    return dropCollection('Transaction').then(()=>{
            return dropCollection('Rule');
        })*/
    })

    beforeEach(()=>{
        return dropCollection('Transaction').then(()=>{
            return dropCollection('Rule');
        })
    })

    describe('getTransactions', () => {
        it('Should return relevant properties on transactions across multiple buckets', () => {
            const testTransactions = require('./data/transactions.json');
            return dbConnection.collection('Transaction').insertMany(testTransactions)
                .then(()=>{
                    const bankAccountId = 'ee905d97-5922-6ddc-33b9-5a83ed280670';
                    return queries.getTransactions(bankAccount,[1,5,6,7])
                        .then((result)=>{
                            should(result.length).eql(4);
                            should(result[0].transactionAmount).eql(100);
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
                return queries.getRuleBucket('Z96616525-c5a3-4958-b1ee-fb856fd83403','5c94f4b7-bf84-418f-a6c6-a26349034a81').then((ruleBucket) => {
                    console.log('ruleBucket',ruleBucket);
                    should(ruleBucket.rules.length).eql(1);
                    should(ruleBucket.rules[0].uuid).eql('cb5e2c41-f3b8-4a8c-9d9c-12c8db9ab12c');
                })    
            })
        })
    })

    const collectionExists = (name) =>{
        return dbConnection.listCollections().toArray()
            .then((collections)=>{
                let result =  _.find(collections, (collection) => collection.name === name );
                return result;
            })
    }

    const dropCollection = (name) =>{
        return collectionExists(name)
            .then((exists) =>{
                return exists ? dbConnection.collection(name).drop() : Promise.resolve();
            })
    }
});




