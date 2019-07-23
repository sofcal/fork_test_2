'use strict';

const Lock = require('../../lib/Lock');
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

describe('Lock.js', function() {
    let sandbox;

    let log = function (obj) {
        console.log(JSON.stringify(obj));
    };
    let logger = {debug: log, info: log, warn: log, error: log};

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should export a function which creates and returns an object that is an instance of Lock and has the correct properties', (done) => {
        let lock = new Lock(logger, {uuid: 'someUUID', expiry: new Date()});

        Lock.should.be.a.Function();
        lock.should.be.an.Object();
        lock.should.be.instanceOf(Lock);

        hasProperty(lock, 'uuid').should.eql(true);
        hasProperty(lock, 'expiry').should.eql(true);
        hasProperty(lock, 'logger').should.eql(true);
        hasProperty(lock, 'validate').should.eql(true);
        hasProperty(lock, 'checkLocked').should.eql(true);

        // Lock has an implementation of this, exposed through the prototype with same func name which is available for instantiated obj.
        hasProperty(Lock, 'validate').should.eql(true);
        hasProperty(Lock, 'filter').should.eql(true); // not exposed at instance level - only a prop of base class function.
        done();
    });

    it('should set the object properties to be that provided when creating a new instance', (done) => {
        let date = new Date();
        let lock = new Lock(logger, {uuid: 'someUUID', expiry: date});

        lock.uuid.should.eql('someUUID');
        lock.expiry.should.eql(date);
        lock.logger.should.eql(logger);
        done();
    });

    it('should set uuid and expiry as undefined if no object was provided as parameter which specifies this', (done) => {
        let lock = new Lock(logger);

        should(lock.uuid).be.undefined();
        should(lock.expiry).be.undefined();
        done();
    });

    it('should set uuid and expiry as undefined if an object was provided as parameter but did not have the uuid and expiry properties', (done) => {
        let lock = new Lock(logger, {});

        should(lock.uuid).be.undefined();
        should(lock.expiry).be.undefined();
        done();
    });

    describe('validate', function () {
        it('should call Lock.validate when calling validate on the instance of Lock', (done) => {
            let lock = new Lock(logger, {uuid: 'someUUID', expiry: new Date()});

            const lockClassSpy = sandbox.spy(Lock, 'validate');
            lockClassSpy.called.should.be.false(); // should not have called validate at this point, as the instance has not made a call to validate.
            lock.validate(); // instance called validate - this should call through to the base class and call it's validate impl.
            lockClassSpy.called.should.be.true();
            done();
        });
    });

    describe('checkLocked', function () {
        it('should throw a TypeError when calling checkLocked with no input', (done) => {
            let lock = new Lock(logger, {uuid: 'someUUID', expiry: new Date()});

            try {
                lock.checkLocked();
                done(new Error('should have thrown'));
            } catch (err) {
                should(err.message).eql('Cannot read property \'uuid\' of undefined');
                done();
            }
        });

        it('should throw an error when calling checkLocked with an object which does not include a uuid', (done) => {
            let lock = new Lock(logger, {uuid: 'someUUID', expiry: new Date()});

            try {
                lock.checkLocked({});
                done(new Error('should have thrown'));
            } catch (err) {
                should(err.message).eql('Check lock failed.  Applies to: ' + lock.uuid + ' not:' + 'undefined');
                done();
            }
        });

        it('should throw an error when calling checkLocked with a uuid which does not match the lock objects uuid value', (done) => {
            let lock = new Lock(logger, {uuid: 'someUUID', expiry: new Date()});

            try {
                lock.checkLocked({ uuid : 'unmatched' });
                done(new Error('should have thrown'));
            } catch (err) {
                should(err.message).eql('Check lock failed.  Applies to: ' + lock.uuid + ' not:' + 'unmatched');
                done();
            }
        });

        it('should throw an error when calling checkLocked with an expiry value which is less than today\'s date', (done) => {
            const date = new Date();
            date.setDate(date.getDate() - 30); // a day which has passed.
            let lock = new Lock(logger, {uuid: 'someUUID', expiry: date});

            try {
                lock.checkLocked({ uuid : 'someUUID' });
                done(new Error('should have thrown'));
            } catch (err) {
                should(err.message).eql(`Lock on: ${lock.uuid} has expired during processing.`);
                done();
            }
        });

        it('should not throw any errors when lock instance has an expiry which is greater than now, as well as also ' +
            'providing an object with a value which matches the lock instance\s uuid', (done) => {
            const date = new Date();
            date.setDate(date.getDate() + 30); // a day in the future.
            let lock = new Lock(logger, {uuid: 'someUUID', expiry: date});

            try {
                lock.checkLocked({ uuid : 'someUUID' });
                done();
            } catch (err) {
                done(new Error('should not have thrown'));
            }
        });
    });

    describe('filter', function () { // not available on the prototype - only Lock itself.
        it('should pass through value which has been provided when calling filter, returning this value', (done) => {
            const someObj = { someProp : 'someVal', someNum : 10 };
            const result = new Lock.filter(someObj);

            result.should.eql(someObj);
            done();
        });
    });
});


