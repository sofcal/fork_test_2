const keyValuePairCache = require('../../src');
// TODO: Magic Mocking Stuff
const sinon = require('sinon');
const should = require('should');

describe('@sage/bc-services-keyvaluepaircache', function() {
    let service;

    beforeEach(() => {
        service = new keyValuePairCache({localhost:true});
    });

    afterEach(() => {
        service.disconnect();
    });

    it('should test something useful', () => {
        sinon.spy(service, 'connect');

        return service.connect()
            .then (() => {
                should.equal(service.connect.called, true);
            })
    });

    it('should test something evil', () => {
        //sinon.stub(service); // Will stub everything in service
        sinon.stub(service, 'connect').resolves(true); // Use resolves rather than returns when using promises

        return service.connect()
            .then((res) => {
                should.equal(res,true);
            })
    });

    it('should test something evil again', () => {
        sinon.stub(service, 'connect').rejects(new Error('Problem connecting to cache')); // Use resolves rather than returns when using promises

        return service.connect()
            .catch((err) => {
                should(err).eql(new Error('Problem connecting to cache'));
            })
    });

    it('should test something slightly less evil', () => {
        const stub = sinon.stub(service, 'retrievePair');
        stub.withArgs('key1').resolves({"key":"key1","value":"value1"});

        return service.retrievePair('key1')
            .then((val1) => {
                should.equal(val1.value,'value1');
            })
    });

});
