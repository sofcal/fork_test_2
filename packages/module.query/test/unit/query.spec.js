'use strict';

const Query = require('../../lib/Query');
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

describe('@sage/bc-query', function() {
    let sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should export a function which is an instance of Query and has the correct properties', (done) => {
        let query = new Query(1, 2, {someProp : 'someVal'});
        let propertyStack = getFuncProperties(query);

        Query.should.be.a.Function();
        propertyStack.should.containEql('startIndex');
        propertyStack.should.containEql('count');
        propertyStack.should.containEql('where');
        propertyStack.should.containEql('groupBy');
        propertyStack.should.containEql('orderBy');
        propertyStack.should.containEql('projection');
        done();
    });

    describe('Query.prototype.validate', function() {
        it('should call validate when instantiating Query', (done) => {
            const querySpy = sandbox.spy(Query.prototype, 'validate');
            querySpy.called.should.be.false(); // should not have called validate at this point, as no instantiation has occurred.
            new Query(1, 2, {someProp : 'someVal'});
            querySpy.called.should.be.true(); // instantiated a Query - validate should have been called now.
            done();
        });

        describe('startIndex', function() {
            it('should have a startIndex value of 0 while providing a number less than 0 for startIndex when creating an instance of Query', (done) => {
                let query = new Query(-26, 2, {someProp : 'someVal'});
                should(query.startIndex).eql(0);
                done();
            });

            it('should have a startIndex value of 0 while providing undefined for startIndex when creating an instance of Query', (done) => {
                let query = new Query(undefined, 2, {someProp : 'someVal'});
                should(query.startIndex).eql(0);
                done();
            });

            it('should have a startIndex value of 0 while providing a value which is not a number when creating an instance of Query', (done) => {
                let query = new Query('not a number', 2, {someProp : 'someVal'});
                should(query.startIndex).eql(0);
                done();
            });
        });

        describe('count', function() {
            it('should have a count value of 50 while providing 0 for count when creating an instance of Query', (done) => {
                const query = new Query(1, 0, {someProp : 'someVal'});
                should(query.count).eql(50);
                done();
            });

            it('should have a count value of 50 while providing a number less than 0 for count when creating an instance of Query', (done) => {
                const query = new Query(1, -26, {someProp : 'someVal'});
                should(query.count).eql(50);
                done();
            });

            it('should have a count value of 50 while providing a number greater than 50 for count when creating an instance of Query', (done) => {
                const query = new Query(1, 120, {someProp : 'someVal'});
                should(query.count).eql(50);
                done();
            });

            it('should have a count value of 50 while providing undefined for count when creating an instance of Query', (done) => {
                const query = new Query(1, undefined, {someProp : 'someVal'});
                should(query.count).eql(50);
                done();
            });

            it('should have a count value of 50 while providing a value which is not a number for count when creating an instance of Query', (done) => {
                const query = new Query(1, 'not a number', {someProp : 'someVal'});
                should(query.count).eql(50);
                done();
            });
        });
    });
});


