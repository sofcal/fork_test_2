'use strict';
const Promise = require('bluebird');
const _ = require('underscore');
const DB =  require('@sage/bc-services-db');
const mongodb = require('mongodb');

class DbQueries {
    constructor(db) {
        this.db = db;
    }

    getProducts(...args) {
        return getProductsImpl(this, ...args);
    }

    getOrgsToRotate(...args){
        return getOrgsToRotateImpl(this, ...args)
    }

    updateOrgPrimaryToken(...args){
        return updateOrgPrimaryTokenImpl(this, ...args)
    }
}

const getProductsImpl = Promise.method((self) => {
    return self.db.collection('Product').find().toArray()
});

const getOrgsToRotateImpl = Promise.method((self, excludedProductIds) => {
    const exclusionsQuery = [];
    _.each(excludedProductIds,(productId) => {
        exclusionsQuery.push({$ne: ['$$products.productId',productId]});
    });

    let aggrQuery = [
        { $project :{
            '_id' : 1,
            'products': {
                $filter: {
                    input: '$products',
                    as: 'products',
                    cond: { $and: exclusionsQuery}
                }
            }
          }
        }
        ,
        {$unwind : '$products'}
        ,
        { '$project': {
            '_id': 1,
            'productId': '$products.productId',
            'token': '$products.token',
            'secondaryToken': '$products.secondaryToken',
            'notRotating' : {$eq: ['$products.token', '$products.secondaryToken']}
        }},
        {$match : {'notRotating': true}}
        ,
        { '$project': {
            '_id': 1,
            'productId': 1,
            'token': 1
        }}
    ];

    return self.db.collection('Organisation').aggregate(aggrQuery).toArray();
});

const updateOrgPrimaryTokenImpl = Promise.method((self, orgId, productId, oldToken, newToken, tokenTimeStamp) =>{
    const query = { '_id' : orgId, 'products.productId' : productId, 'products.token': oldToken};
    const update = { "$set": { "products.$.token": newToken, "products.$.tokenTimestamp": tokenTimeStamp}}

    return self.db.collection('Organisation').updateOne(query, update);
});

module.exports = DbQueries;




