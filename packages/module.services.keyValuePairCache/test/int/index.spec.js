const KeyValuePairCache = require('../../src/index');
const KeyValuePair = require('../../src/KeyValuePair');
const should = require('should');

describe('@sage/bc-services-keyvaluepaircache', function() {
    let service;

    before(() => {
        service = new KeyValuePairCache({localhost:true});
        service.connect();
    });

    after(() => {
        service.disconnect();
    });

    it('should store, retrieve and delete data', () => {
        let kvp = new KeyValuePair({key:'key1',value:'value1'});
        return service.storePair(kvp,300)
            .then((response) => {
                should.equal(response.value, 'value1');
            })
            .then(() => {
                return service.retrievePair('key1')
                    .then((val1_1) => {
                        should.equal(val1_1.value,'value1');
                    });
            })
            .then(() => {
                return service.deletePair('key1')
                    .then(() => {
                        return service.retrievePair('key1')
                            .catch((err) => {
                                should(err).eql(new Error('KeyValuePair not found: key1'));
                            })
                    })
            })
    });

    it('should store, update and delete data', () => {
        let kvp = new KeyValuePair({key:'key2',value:'value2'});
        return service.storePair(kvp,300)
            .then(() => {
                return service.retrievePair('key2')
                    .then((val2_1) => {
                        should.equal(val2_1.value,'value2');
                    })
            })
            .then(() => {
                kvp.value = 'value2_updated';
                return service.upsertPair(kvp,300)
                    .then(() => {
                        return service.retrievePair('key2')
                            .then((val2_2) => {
                                should.equal(val2_2.value,'value2_updated');
                            })
                    })
            })
            .then(() => {
                return service.deletePair('key2')
                    .then(() => {
                        return service.retrievePair('key2')
                            .catch((err) => {
                                should(err).eql(new Error('KeyValuePair not found: key2'));
                            })
                    })
            })
    });

    it('should error when no key is submitted on retrieve', () => {
        return service.retrievePair()
            .catch((err) => {
                should(err).eql(new Error('Invalid Key'));
            })
    });

    it('should error when no key is submitted on delete', () => {
        return service.deletePair()
            .catch((err) => {
                should(err).eql(new Error('Invalid Key'));
            })
    });

    it('should error when no key value pair is submitted on store', () => {
        return service.storePair()
            .catch((err) => {
                should(err).eql(new Error('Invalid Pair'));
            })
    });

    it('should error when connection is lost', () => {
        let kvp = new KeyValuePair({key:'key2',value:'value2'});
        return service.disconnect()
            .then(() => {
                return service.storePair(kvp,300)
                    .catch((err) => {
                        should(err).eql(new Error('Problem writing to cache'));
                    })
            })
    });

    it('should error when connection does not exist', () => {
        let kvp = new KeyValuePair({key:'key2',value:'value2'});
        service = new KeyValuePairCache({});
        return service.storePair(kvp,300)
            .catch((err) => {
                should(err).eql(new Error('Not connected to cache'));
            })
    });
});
