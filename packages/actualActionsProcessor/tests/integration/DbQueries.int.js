const should = require('should');
const sinon = require('sinon');
const _ = require('underscore');
const DB =  require('internal-services-db');
const DbQueries = require('../../DbQueries')

describe('DbQueries',()=>{
    let db;
    let dbConnection;
    let queries;

    before(()=>{
        db = new DB({env:'', region:'', domain:'', username:'', password:'', replicaSet:''});
        db.connectionString = 'mongodb://localhost';
        return db.connect('bank_db')
            .then((result) =>{
                dbConnection = result;
                queries = new DbQueries(dbConnection);
            })
    })

    after(()=>{
        return db.disconnect();
    })

    afterEach(()=>{
     //   return dropCollection('Transaction')
    })

    beforeEach(()=>{
        return dropCollection('Transaction')
    })

    describe('getTransactions', () =>{
        it.only('Should return relevant properties on transactions across multiple buckets', () => {
            const testTransactions = require('./transactions.json');
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




