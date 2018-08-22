'use strict';
const Promise = require('bluebird');
const _ = require('underscore');
const DB =  require('internal-services-db');
const mongodb = require('mongodb');

class DbQueries {
    constructor(db) {
        this.db = db;
    }

    getProducts(...args) {
        return getProductsImpl(this, ...args);
    }


}

const getProductsImpl = Promise.method((self) => {
    return self.db.collection('Product').find().toArray()
});

module.exports = DbQueries;
