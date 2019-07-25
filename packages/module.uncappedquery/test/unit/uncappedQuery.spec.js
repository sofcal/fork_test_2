'use strict';

const Query = require('../Query');
const UncappedQuery = require('../../lib/UncappedQuery')(Query);
const sinon = require('sinon');

// checker for properties of an instantiated object. Digs in to prototype level to ensure chained properties are included.
function hasProperty(obj, propName) {
    for (; obj != null; obj = Object.getPrototypeOf(obj)) {
        let op = Object.getOwnPropertyNames(obj);
        for (let i = 0; i < op.length; i++) {
            if (op[i] === propName) {
                return true;
            }
        }
    }
    return false;
}

describe('UncappedQuery.js', function() {
    let sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should export a function for UncappedQuery which can be instantiated and has the correct properties', (done) => {
        let uq = new UncappedQuery(1, 2, {someProp : 'someVal'});

        UncappedQuery.should.be.a.Function();
        uq.should.be.an.Object();
        uq.should.be.instanceOf(Query);

        hasProperty(uq, 'startIndex').should.eql(true);
        hasProperty(uq, 'count').should.eql(true);
        hasProperty(uq, 'where').should.eql(true);
        hasProperty(uq, 'groupBy').should.eql(true);
        hasProperty(uq, 'orderBy').should.eql(true);
        hasProperty(uq, 'projection').should.eql(true);
        hasProperty(uq, 'validate').should.eql(true);
        done();
    });

    describe('UncappedQuery.prototype.validate', function() {
        it('should call validate when instantiating UncappedQuery', (done) => {
            const uqSpy = sandbox.spy(UncappedQuery.prototype, 'validate');
            uqSpy.called.should.be.false(); // should not have called validate at this point, as no instantiation has occurred.
            new UncappedQuery(1, 2, {someProp : 'someVal'});
            uqSpy.called.should.be.true(); // instantiated an UncappedQuery - validate should have been called now.
            done();
        });

        describe('startIndex', function() {
            it('should have a startIndex value of 0 while providing a number less than 0 for startIndex when creating an instance of UncappedQuery', (done) => {
                let uq = new UncappedQuery(-26, 2, {someProp : 'someVal'});
                should(uq.startIndex).eql(0);
                done();
            });

            it('should have a startIndex value of 0 while providing undefined for startIndex when creating an instance of UncappedQuery', (done) => {
                let uq = new UncappedQuery(undefined, 2, {someProp : 'someVal'});
                should(uq.startIndex).eql(0);
                done();
            });

            it('should have a startIndex value of 0 while providing a value which is not a number when creating an instance of UncappedQueery', (done) => {
                let uq = new UncappedQuery('not a number', 2, {someProp : 'someVal'});
                should(uq.startIndex).eql(0);
                done();
            });
        });

        describe('count', function() {
            it('should have a count value of 100 while providing 0 for count when creating an instance of UncappedQuery', (done) => {
                const uq = new UncappedQuery(1, 0, {someProp : 'someVal'});
                should(uq.count).eql(100);
                done();
            });

            it('should have a count value of 100 while providing a number less than 0 for count when creating an instance of UncappedQuery', (done) => {
                const uq = new UncappedQuery(1, -26, {someProp : 'someVal'});
                should(uq.count).eql(100);
                done();
            });

            it('should have a count value of 100 while providing undefined for count when creating an instance of UncappedQuery', (done) => {
                const uq = new UncappedQuery(1, undefined, {someProp : 'someVal'});
                should(uq.count).eql(100);
                done();
            });

            it('should have a count value of 100 while providing a value which is not a number for count when creating an instance of UncappedQuery', (done) => {
                const uq = new UncappedQuery(1, 'not a number', {someProp : 'someVal'});
                should(uq.count).eql(100);
                done();
            });
        });
    });
});


