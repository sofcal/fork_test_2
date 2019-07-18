'use strict';

const Queries = require('../../../lib/Queries');
const Query = require('../../../lib/Query');
const UncappedQuery = require('../../../lib/UncappedQuery');
const sinon = require('sinon');

let getFuncProperties = (func) => {
    let keys = [];
    for (let key in func) {
        if (func.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys;
};

describe('@sage/bc-queries', function() {
    it('should export an object which contains the results of exporting Query and UncappedQuery', (done) => {
        console.log('Here is the query obj' + JSON.stringify(Queries));
        Queries.should.be.an.Object();
        
        const propertyStack = getFuncProperties(Queries);
        propertyStack.should.containEql('Query');
        propertyStack.should.containEql('UncappedQuery');
        done();
    });
});


