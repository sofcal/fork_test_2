'use strict';

const Lock = require('../../src/Lock');
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
});


