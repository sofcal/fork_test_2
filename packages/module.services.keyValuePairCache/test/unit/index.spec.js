const keyValuePairCache = require('../../src');
const KeyValuePair = require('../../src/KeyValuePair');
const sinon = require('sinon');
const should = require('should');
const Promise = require('bluebird');
const redis = Promise.promisifyAll(require('redis'));

describe('@sage/bc-services-keyvaluepaircache', function() {
    let service;
    let sandbox;

    beforeEach(() => {
        service = new keyValuePairCache({localhost:true});
        sandbox = sinon.createSandbox();
        sandbox.stub(redis, 'createClient')
            .returns(new MockRedis());
        service.connect();
    });

    afterEach(() => {
        service.disconnect();
        sandbox.restore();
    });

    it('should process store successfully', () => {
        sandbox.stub(service.redisClient, 'setAsync').returns(Promise.resolve());
        let kvp = new KeyValuePair({key:'key1',value:'value1'});
        return service.storePair(kvp,300)
            .then((response) => {
                should.equal(response.value, 'value1');
            })
    });

    it('should process retrieve successfully', () => {
        sandbox.stub(service.redisClient, 'getAsync').returns(Promise.resolve("{\"type\":\"Object\",\"value\":\"dummyValue\"}"));
        return service.retrievePair('dummyKey')
            .then((response) => {
                should.equal(response.value, 'dummyValue');
            })
    });

    it('should process upsert as set', () => {
        let setStub = sandbox.stub(service.redisClient, 'setAsync').returns(Promise.resolve());
        let kvp = new KeyValuePair({key:'key1_mock',value:'value1_mock'});
        return service.upsertPair(kvp, 300)
            .then(() => {
                should.equal(setStub.callCount, 1);
            })
    });

    it('should error when upsert rejects', () => {
        sandbox.stub(service.redisClient, 'setAsync').returns(Promise.reject());
        let kvp = new KeyValuePair({key:'key1_mock',value:'value1_mock'});
        return service.upsertPair(kvp, 300)
            .catch((err) => {
                should(err).eql(new Error('Problem writing to cache'));
            })
    });

    it('should error when delete rejects', () => {
        sandbox.stub(service.redisClient, 'delAsync').returns(Promise.reject());
        return service.deletePair('dummyKey')
            .catch((err) => {
                should(err).eql(new Error('Problem deleting from cache'));
            })
    });

    it('should error when no pair is submitted on upsert', () => {
        return service.upsertPair()
            .catch((err) => {
                should(err).eql(new Error('Invalid Pair'));
            })
    });

    it('should error when no pair is submitted on delete', () => {
        sandbox.stub(service.redisClient, 'delAsync').returns(Promise.resolve());
        return service.deletePair()
            .catch((err) => {
                should(err).eql(new Error('Invalid Key'));
            })
    });
});

class MockRedis{
    constructor() {
        this.connected = true;
    }

    setAsync(){};
    getAsync(){};
    delAsync(){};
    quitAsync(){};
}
