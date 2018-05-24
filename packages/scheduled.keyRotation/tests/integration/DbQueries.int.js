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
        return dropCollection('Organisation')
            .then(()=> dropCollection('Product'))
    })

    beforeEach(()=>{
        return dropCollection('Organisation')
            .then(()=> dropCollection('Product'))
            .then(()=> {
                return dbConnection.collection('Organisation').update(
                    {
                        _id: '241a3c4a-333c-4c2d-9c79-ccdf734082b1'
                    },{
                        'adminEmail' : 'admin@email.com',
                        'products' : [
                            {
                                'productId' : 'productId2',
                                'token' : 'token2',
                                'secondaryToken' : 'token2',
                                'tokenTimestamp' : null
                            },
                        ]
                    },{
                        upsert: true
                    });
            })
            .then(()=> {
                return dbConnection.collection('Organisation').update(
                    {
                        _id: '89a846c6-0ffe-4bd5-9109-f3ea4dc7a9a4'
                    },{
                        'adminEmail' : 'admin@email.com',
                        'products' : [
                            {
                                'productId' : 'productId1',
                                'token' : 'token1',
                                'secondaryToken' : 'token1',
                                'tokenTimestamp' : null
                            },
                            {
                                'productId' : 'productId2',
                                'token' : 'token2',
                                'secondaryToken' : 'token2',
                                'tokenTimestamp' : null
                            },
                            {
                                'productId' : 'productId3',
                                'token' : 'token3',
                                'secondaryToken' : 'token3',
                                'tokenTimestamp' : null
                            }
                        ]
                    },{
                        upsert: true
                    });
            })
            .then(()=> {
                return dbConnection.collection('Organisation').update(
                    {
                        _id: '06204037-ecea-43e0-9c32-cda445373d1d'
                    },{
                        'adminEmail' : 'admin@email.com',
                        'products' : [
                            {
                                'productId' : 'productId1',
                                'token' : 'token1',
                                'secondaryToken' : 'token1',
                                'tokenTimestamp' : null
                            },
                            {
                                'productId' : 'productId2',
                                'token' : 'token2',
                                'secondaryToken' : 'rotating',
                                'tokenTimestamp' : null
                            },
                            {
                                'productId' : 'productId3',
                                'token' : 'token3',
                                'secondaryToken' : 'token3',
                                'tokenTimestamp' : null
                            }
                        ]
                    },{
                        upsert: true
                    });
            })
            .then(() => dbConnection.collection('Product').update({_id: '4399ba47-c0b7-46df-ac6f-13c9409fea02'},{'name' : 'product1',},{upsert: true}))
            .then(() => dbConnection.collection('Product').update({_id: '1dfd1a9c-51fd-41e6-9b1d-88b2e12cab65'},{'name' : 'product2',},{upsert: true}))
            .then(() => dbConnection.collection('Product').update({_id: 'b50b244a-e183-4855-b815-ee40208e1a22'},{'name' : 'product3',},{upsert: true}))
    })

    describe('getProducts', () =>{
        it('Should return contents of product collection', () =>{
            return queries.getProducts()
                .then((result)=>{
                    should(result.length).eql(3);
                    should(result[0].name).eql('product1');
                    should(result[1].name).eql('product2');
                    should(result[2].name).eql('product3');
                })
        })
    });

    describe('getOrgsToRotate', () => {
        it('Should project fields', () => {
            return queries.getOrgsToRotate(['productId1','productId3'])
                .then((result)=>{
                   let fields  = Object.keys(result[0]);
                   should(fields).eql(['_id','productId','token']) ;
                })
        })

        it('Should ignore products that are excluded', () => {
            return queries.getOrgsToRotate(['productId1','productId3'])
                .then((result)=>{

                    should(result).eql([{
                            _id: '241a3c4a-333c-4c2d-9c79-ccdf734082b1',
                            productId: 'productId2',
                            token: 'token2'
                        },
                        {    _id: '89a846c6-0ffe-4bd5-9109-f3ea4dc7a9a4',
                            productId: 'productId2',
                            token: 'token2'
                        }]);
                })
        })
    });

    describe('updateOrgPrimaryTokenImpl', () => {
        it('should update specific token', () =>{
            let queries = new DbQueries(dbConnection);
            return queries.updateOrgPrimaryToken('89a846c6-0ffe-4bd5-9109-f3ea4dc7a9a4', 'productId2', 'token2', '*NEWTOKEN*', new Date(2009,3,3))
                .then(() => dbConnection.collection('Organisation').find().toArray())
                .then((orgs) => {
                    should(orgs[0]).eql({
                        _id: '241a3c4a-333c-4c2d-9c79-ccdf734082b1',
                        adminEmail: 'admin@email.com',
                        products: [{'productId': 'productId2', 'token': 'token2', 'secondaryToken': 'token2', 'tokenTimestamp': null}]
                    });
                    should(orgs[1]).eql({
                        _id: '89a846c6-0ffe-4bd5-9109-f3ea4dc7a9a4',
                        'adminEmail' : 'admin@email.com',
                        'products' : [
                            {
                                'productId' : 'productId1',
                                'token' : 'token1',
                                'secondaryToken' : 'token1',
                                'tokenTimestamp' : null
                            },
                            {
                                'productId' : 'productId2',
                                'token' : '*NEWTOKEN*',
                                'secondaryToken' : 'token2',
                                'tokenTimestamp' : new Date(2009,3,3)
                            },
                            {
                                'productId' : 'productId3',
                                'token' : 'token3',
                                'secondaryToken' : 'token3',
                                'tokenTimestamp' : null
                            }
                        ]
                    });
                    should(orgs[2]).eql({
                        _id: '06204037-ecea-43e0-9c32-cda445373d1d',
                        'adminEmail' : 'admin@email.com',
                            'products' : [
                            {
                                'productId' : 'productId1',
                                'token' : 'token1',
                                'secondaryToken' : 'token1',
                                'tokenTimestamp' : null
                            },
                            {
                                'productId' : 'productId2',
                                'token' : 'token2',
                                'secondaryToken' : 'rotating',
                                'tokenTimestamp' : null
                            },
                            {
                                'productId' : 'productId3',
                                'token' : 'token3',
                                'secondaryToken' : 'token3',
                                'tokenTimestamp' : null
                            }
                        ]
                    });
                });
        })
    });

    const dropCollection = (name) =>{
        return collectionExists(name)
            .then((exists) =>{
                return exists ? dbConnection.collection(name).drop() : Promise.resolve();
            })
    }

    const collectionExists = (name) =>{
        return dbConnection.listCollections().toArray()
            .then((collections)=>{
                let result =  _.find(collections, (collection) => collection.name === name );
                return result;
            })
    }
});


