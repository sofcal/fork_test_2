const Promise = require('bluebird');
const should = require('should');
const _ = require('underscore');
const DB =  require('@sage/bc-services-db');
const DbQueries = require('../../lib/DbQueries');

describe('runonce-intacct-transactiongenerator.DbQueries',()=>{
    let db;
    let dbConnection;
    let queries;
    const bankAccountId = '241a3c4a-333c-4c2d-9c79-ccdf734082b1';

    before(()=>{
        db = new DB({ localhost: true, db: 'bank_db' });
        return db.connect()
            .then((result) =>{
                dbConnection = result;
                queries = new DbQueries(dbConnection);
            })
    });

    after(()=>{
        return Promise.resolve(undefined)
            .then(() => {
                const connection = db.getConnection();
                if(connection) {
                    //return connection.dropDatabase();
                }
            })
            .then(() => db.disconnect());
    });

    afterEach(()=>{
        //return dropCollection('BankAccount')
         //   .then(()=> dropCollection('Transaction'))
    });

    beforeEach(()=>{
        return dropCollection('BankAccount')
            .then(()=> dropCollection('Transaction'))
            .then(()=> {
                return dbConnection.collection('BankAccount').update(
                    {
                        _id: bankAccountId
                    },{
                    },{
                        upsert: true
                    });
            })
    });

    describe('getBankAccount', () =>{
        it.only('Should return the bankAccount', () =>{
            return queries.getBankAccount(bankAccountId)
                .then((result)=>{
                    should(result.length).eql(1);
                })
        })
    });

    describe('updateBankAccount', () => {
        it('Should update the bank account', () => {
            const bankAccount = {};
            return queries.getBankAccount(bankAccount)
                .then((result)=>{

                })
        });

    });

    describe('updateTransactions', () => {
        it('should create transactions', () => {
        })
    });

    const dropCollection = (name) => {
        return collectionExists(name)
            .then((exists) =>{
                if (exists) {
                    return dbConnection.collection(name).drop();
                }
            })
    };

    const collectionExists = (name) =>{
        return dbConnection.listCollections().toArray()
            .then((collections)=>  _.find(collections, (collection) => collection.name === name ));
    }
});


