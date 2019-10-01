const resources = require('@sage/bc-common-resources');
const servicesUtils = require('../../lib');
const should = require('should');
const sinon = require('sinon');

const { StatusCodeError, StatusCodeErrorItem } = require('@sage/bc-common-statuscodeerror');

describe('@sage/bc-services-utils.utils', () => {
    const sandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
    });

    describe('basic structure', () => {
        it('Should export an object', () => {
            should(servicesUtils).be.an.Object().with.properties(
                'wrapServiceFunctionSetUp',
                'ensureId',
                'extend',
                'addSingleIfPresent',
                'addInIfPresent'
            );
        });
    });

    describe('wrapServiceFunction', () => {
        const dummyService = sandbox.stub();
        class DummyApplicationError extends Error {
            constructor(items, statusCode) {
                super();
                this.name = 'MyError';
                this.items = items;
                this.statusCode = statusCode;
            }
        }
        const args = [1, 2, 3];
        const wrapServiceFunction = servicesUtils.wrapServiceFunctionSetUp(DummyApplicationError);

        it('returns a promise', () => {
            const dummyPromiseFunc = (x) => Promise.resolve(x);
            const result = wrapServiceFunction(dummyService, dummyPromiseFunc, args);

            should(result).be.a.Promise();
        });

        it('calls func with correct arguments', () => {
            const dummyPromiseFuncStub = sandbox.stub().resolves();

            return wrapServiceFunction(dummyService, dummyPromiseFuncStub, args)
                .then(() => {
                    should(dummyPromiseFuncStub.calledOnce).be.true(`Passed in function should be called once - actually called ${dummyPromiseFuncStub.callCount}`);
                    should(dummyPromiseFuncStub.calledWithExactly(...args)).be.true(`Func should be called with provided arguments ${args} - actually called with ${dummyPromiseFuncStub.args[0]}`);
                });
        });

        it('calls func with "this" set to service', () => {
            const dummyPromiseFuncStub = sandbox.stub().resolves();

            return wrapServiceFunction(dummyService, dummyPromiseFuncStub, args)
                .then(() => {
                    should(dummyPromiseFuncStub.thisValues[0]).eql(dummyService);
                });
        });

        it('should throw StatusCodeError if func fails with StatusCodeError', () => {
            const statCode = 401;
            const errItem = 'errItem';
            const statusErr = new StatusCodeError([errItem], statCode);
            const dummyPromiseFuncStub = sandbox.stub().rejects(statusErr);

            return wrapServiceFunction(dummyService, dummyPromiseFuncStub, args)
                .then(() => {
                    throw new Error('should have thrown');
                })
                .catch((err) => {
                    should(err).be.an.instanceOf(StatusCodeError);
                    should(err).have.property('statusCode', statCode);
                    should(err).have.property('items').which.is.an.Array().of.length(1);
                    should(err.items[0]).eql(errItem);
                });
        });

        it('should throw StatusCodeError if func fails with ApplicationError', () => {
            const statCode = 401;
            const errItems = ['ApplicationError'];
            const dummyPromiseFuncStub = sandbox.stub().rejects(new DummyApplicationError(errItems, statCode));

            return wrapServiceFunction(dummyService, dummyPromiseFuncStub, args)
                .then(() => {
                    throw new Error('should have thrown');
                })
                .catch((err) => {
                    should(err).be.an.instanceOf(StatusCodeError);
                    should(err).have.property('statusCode', statCode);
                    should(err).have.property('items').which.is.Array().of.length(1);
                    should(err.items[0]).be.instanceOf(StatusCodeErrorItem);
                });
        });

        it('should throw StatusCodeError if func fails with Unknown error', () => {
            class UnknownError extends Error {
                constructor(items, statusCode) {
                    super();
                    this.items = items;
                    this.statusCode = statusCode;
                }
            }
            const dummyPromiseFuncStub = sandbox.stub().rejects(new UnknownError(['unknown error'], 500));

            return wrapServiceFunction(dummyService, dummyPromiseFuncStub, args)
                .then(() => {
                    throw new Error('should have thrown');
                })
                .catch((err) => {
                    should(err).be.an.instanceOf(StatusCodeError);
                    should(err).have.property('statusCode', 400);
                    should(err).have.property('items').which.is.Array();
                    should(err.items[0]).be.instanceOf(StatusCodeErrorItem);
                    should(err.items[0].applicationCode).be.eql(resources.services.common.UnknownErrorCode);
                });
        });
    });

    describe('ensureId', () => {
        it('should not change input where query.where.uuid not populated', () => {
            const query = {
                where: {}
            };
            const compare = JSON.parse(JSON.stringify(query));
            Object.freeze(query);
            servicesUtils.ensureId(query);
            should(query).eql(compare);
        });

        it('should mutate input where query.where.uuid not populated', () => {
            const query = {
                where: {
                    uuid: 'change to _id',
                }
            };
            const compare = JSON.parse(JSON.stringify(query));
            servicesUtils.ensureId(query);
            should(query).not.eql(compare);
            should(query).have.propertyByPath('where', '_id').eql(compare.where.uuid);
            should(query).not.have.propertyByPath('where', 'uuid');
        });
    });

    describe('extend', () => {
        it('should return empty object when empty source/destination passed in (and method not put)', () => {
            const destination = {};
            const source = {};
            const method = 'get';
            const keys = [];
            const readOnlyKeys = [];

            const result = servicesUtils.extend(destination, source, method, keys, readOnlyKeys);
            should(result).be.an.Object().which.is.empty();
        });

        it('should return empty object when empty keys/destination passed in (and method not put)', () => {
            const destination = {};
            const source = {
                source1: 'test',
            };
            const method = 'get';
            const keys = [];
            const readOnlyKeys = [];

            const result = servicesUtils.extend(destination, source, method, keys, readOnlyKeys);
            should(result).be.an.Object().which.is.empty();
        });

        it('should return empty object when no matching keys found', () => {
            const destination = {};
            const source = {
                source1: 'test',
            };
            const method = 'get';
            const keys = [
                'notFound',
            ];
            const readOnlyKeys = [];

            const result = servicesUtils.extend(destination, source, method, keys, readOnlyKeys);
            should(result).be.an.Object().which.is.empty();
        });

        it('should filter for provided keys', () => {
            const destination = {};
            const source = {
                source1: 'test1',
                source2: 'test2',
                source3: 'test3',
            };
            const method = 'get';
            const keys = [
                'source1',
                'source2',
            ];
            const readOnlyKeys = [];

            const result = servicesUtils.extend(destination, source, method, keys, readOnlyKeys);
            should(result).be.an.Object().with.keys(...keys);
            // check each key is populated corectly
            keys.forEach((key) => should(result).have.property(key, source[key]));
        });

        it('should include keys from destination', () => {
            const destination = {
                destination1: 'dest1',
                destination2: 'dest2',
            };
            const source = {
                source1: 'test1',
                source2: 'test2',
                source3: 'test3',
            };
            const method = 'get';
            const keys = [];
            const readOnlyKeys = [];

            const result = servicesUtils.extend(destination, source, method, keys, readOnlyKeys);
            should(result).be.an.Object().with.keys(...Object.keys(destination));
            // check each key is populated corectly
            Object.keys(destination).forEach((key) => should(result).have.property(key, destination[key]));
        });

        it('should return empty object when method = put, with no readOnly keys', () => {
            const destination = {
                destination1: 'dest1',
                destination2: 'dest2',
            };
            const source = {
                source1: 'test',
            };
            const method = 'put';
            const keys = [];
            const readOnlyKeys = [];

            const result = servicesUtils.extend(destination, source, method, keys, readOnlyKeys);
            should(result).be.an.Object().which.is.empty();
        });

        it('should filter for provided readOnly keys', () => {
            const destination = {
                destination1: 'dest1',
                destination2: 'dest2',
                destination3: 'dest3',
            };
            const source = {
                source1: 'test',
            };
            const method = 'put';
            const keys = [];
            const readOnlyKeys = [
                'destination1',
                'destination2',
                'destination3',
            ];

            const result = servicesUtils.extend(destination, source, method, keys, readOnlyKeys);
            should(result).be.an.Object().with.keys(...readOnlyKeys);
            // check each key is populated corectly
            readOnlyKeys.forEach((key) => should(result).have.property(key, destination[key]));
        });

        it('should combine keys from source and destination', () => {
            const destination = {
                destination1: 'dest1',
                destination2: 'dest2',
                destination3: 'dest3',
            };
            const source = {
                source1: 'test',
                source2: 'test',
            };
            const method = 'get';
            const keys = [
                'source1',
                'source2',
            ];
            const readOnlyKeys = [];

            const result = servicesUtils.extend(destination, source, method, keys, readOnlyKeys);
            should(result).be.an.Object().with.keys(...Object.keys(destination), ...Object.keys(source));
            // check each key is populated corectly
            Object.keys(destination).forEach((key) => should(result).have.property(key, destination[key]));
            Object.keys(source).forEach((key) => should(result).have.property(key, source[key]));
        });

        it('should overwrite keys from source', () => {
            const destination = {
                overwrite: 'dest1',
            };
            const source = {
                overwrite: 'source1',
            };
            const method = 'get';
            const keys = [
                'overwrite',
            ];
            const readOnlyKeys = [];

            const result = servicesUtils.extend(destination, source, method, keys, readOnlyKeys);
            should(result).be.an.Object().with.size(1);
            // check each key is populated corectly
            Object.keys(source).forEach((key) => should(result).have.property(key, source[key]));
        });
    });

    describe('addSingleIfPresent', () => {
        it('if query key populated, it should be added to where object', () => {
            const qKey = 'qKey';
            const wKey = 'wKey';
            const query = Object.freeze({
                [qKey]: 'copy from'
            });
            const where = {};

            servicesUtils.addSingleIfPresent(where, query, qKey, wKey);
            should(where).have.property(wKey, query[qKey]);
        });

        it('if query key not present, where object should not be changed', () => {
            const qKey = 'notFound';
            const wKey = 'wKey';
            const query = Object.freeze({
                test: 'copy from'
            });
            const where = Object.freeze({});

            servicesUtils.addSingleIfPresent(where, query, qKey, wKey);
            should(where).not.have.property(wKey, query[qKey]);
        });

        it('if query key is undefined, where object should not be changed', () => {
            const qKey = 'qKey';
            const wKey = 'wKey';
            const query = Object.freeze({
                [qKey]: undefined
            });
            const where = Object.freeze({});

            servicesUtils.addSingleIfPresent(where, query, qKey, wKey);
            should(where).not.have.property(wKey, query[qKey]);
        });

        it('if query key present in query and where objects, the where object should be replaced', () => {
            const qKey = 'qKey';
            const wKey = 'wKey';
            const query = Object.freeze({
                [qKey]: 'copy from'
            });
            const where = {
                [wKey]: 'replace me'
            };

            servicesUtils.addSingleIfPresent(where, query, qKey, wKey);
            should(where).have.property(wKey, query[qKey]);
        });

        it('should default wkey to qkey if not populated', () => {
            const qKey = 'qKey';
            const query = Object.freeze({
                [qKey]: 'copy from'
            });
            const where = {};

            servicesUtils.addSingleIfPresent(where, query, qKey);
            should(where).have.property(qKey, query[qKey]);
        });
    });

    describe('addInIfPresent', () => {
        it('should not mutate "where" object when query key does not exist', () => {
            const qKey = 'notFound';
            const wKey = 'wKey';
            const query = Object.freeze({
                test: 'copy from'
            });
            const where = Object.freeze({});

            servicesUtils.addInIfPresent(where, query, qKey, wKey);
            should(where).not.have.property(wKey, query[qKey]);
        });

        it('should not mutate "where" object when query key is undefined', () => {
            const qKey = 'qKey';
            const wKey = 'wKey';
            const query = Object.freeze({
                [qKey]: undefined
            });
            const where = Object.freeze({});

            servicesUtils.addInIfPresent(where, query, qKey, wKey);
            should(where).not.have.property(wKey, query[qKey]);
        });

        it('should add key to "where" when query key is an array', () => {
            const qKey = 'qKey';
            const wKey = 'wKey';
            const values = ['1', '2', '3'];
            const query = Object.freeze({
                [qKey]: values
            });
            const where = {};

            servicesUtils.addInIfPresent(where, query, qKey, wKey);
            should(where).have.propertyByPath(wKey, '$in').eql(values);
        });

        it('should add key to "where" when query key is a string', () => {
            const qKey = 'qKey';
            const wKey = 'wKey';
            const values = '1, 2, 3';
            const query = Object.freeze({
                [qKey]: values
            });
            const where = {};

            servicesUtils.addInIfPresent(where, query, qKey, wKey);
            should(where).have.propertyByPath(wKey, '$in').which.is.an.Array();
            should(where[wKey].$in).eql(values.split(','));
        });

        it('should default wkey to qkey if not populated', () => {
            const qKey = 'qKey';
            const values = ['1', '2', '3'];
            const query = Object.freeze({
                [qKey]: values
            });
            const where = {};

            servicesUtils.addInIfPresent(where, query, qKey);
            should(where).have.propertyByPath(qKey, '$in').which.is.an.Array().eql(values);
        });
    });
});
