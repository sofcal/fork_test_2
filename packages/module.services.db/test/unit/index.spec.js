const DB = require('../../lib');
const should = require('should');
const sinon = require('sinon');

describe('@sage/bc-services-db.index', function(){
    const options = {};
    let sandbox;

    before(() => {
        sandbox = sinon.createSandbox();
    });

    beforeEach(() => {
        options.env = 'env';
        options.region = 'region';
        options.domain = 'domain';
        options.username = 'username';
        options.password = 'password';
        options.replicaSet = 'replicaSet';
        options.db = 'db_name'
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should create an instance of DB', () => {
            const actual = new DB(options);
            should(actual).be.an.instanceof(DB);
        });

        it('should create a connection string', () => {
            const actual = new DB(options);
            const expected = 'mongodb://username:password@mdb-a.env.region.domain:27017,mdb-b.env.region.domain:27017,mdb-c.env.region.domain:27017/db_name?replicaSet=replicaSet';
            should(actual.connectionString).eql(expected);
        });

        it('should not include username:password if username not present', () => {
            delete options.username;
            const actual = new DB(options);
            const expected = 'mongodb://mdb-a.env.region.domain:27017,mdb-b.env.region.domain:27017,mdb-c.env.region.domain:27017/db_name?replicaSet=replicaSet';
            should(actual.connectionString).eql(expected);
        });

        it('should not include username:password if password not present', () => {
            delete options.password;
            const actual = new DB(options);
            const expected = 'mongodb://mdb-a.env.region.domain:27017,mdb-b.env.region.domain:27017,mdb-c.env.region.domain:27017/db_name?replicaSet=replicaSet';
            should(actual.connectionString).eql(expected);
        });

        it('should not include replicaSet if replicaSet not present', () => {
            delete options.replicaSet;
            const actual = new DB(options);
            const expected = 'mongodb://username:password@mdb-a.env.region.domain:27017,mdb-b.env.region.domain:27017,mdb-c.env.region.domain:27017/db_name';
            should(actual.connectionString).eql(expected);
        });

        it('should generate for localhost if localhost is set', () => {
            options.localhost = true;
            const actual = new DB(options);
            const expected = 'mongodb://localhost:27017/db_name';
            should(actual.connectionString).eql(expected);
        });
    });

    describe('Create', () => {
        it('should create an instance of DB', () => {
            const actual = DB.Create(options);
            should(actual).be.an.instanceof(DB);
        });
    });

    describe('getConnection', () => {
        it('should return the connection if there is a client', () => {
            const db = DB.Create(options);
            db.client = { db: () => {} };
            const connection = { value: 'connection' };

            sandbox.stub(db.client, 'db').returns(connection);

            const actual = db.getConnection();
            should(actual).eql(connection);
        });

        it('should return null if there is no client', () => {
            const db = DB.Create(options);

            const actual = db.getConnection();
            should(actual).eql(null);
        })
    });

    describe('connect', () => {
        it('should connect to the database', () => {
            options.localhost = true;
            const db = new DB(options);
            const client = { db: () => {} };
            const connection = { value: 'connection' };

            sandbox.stub(client, 'db').returns(connection);
            sandbox.stub(db._MongoClient, 'connect').resolves(client);

            return db.connect()
                .then((actual) => {
                    should(actual).eql(connection);

                    should(db._MongoClient.connect.callCount).eql(1);
                    should(db._MongoClient.connect.calledWithExactly(
                        'mongodb://localhost:27017/db_name'
                    )).eql(true);

                    should(client.db.callCount).eql(1);
                    should(client.db.calledWithExactly(

                    )).eql(true);
                })
        });
    });

    describe('disconnect', () => {
        it('should connect to the database', () => {
            options.localhost = true;
            const db = new DB(options);
            const client = { close: () => {} };
            db.client = client;

            sandbox.stub(client, 'close').resolves();

            return db.disconnect()
                .then(() => {
                    should(client.close.callCount).eql(1);
                    should(client.close.calledWithExactly(

                    )).eql(true);

                    should(db.client).eql(null);
                });
        });

        it('should not try to disconnect if there is no client', () => {
            options.localhost = true;
            const db = new DB(options);
            db.client = undefined;

            return db.disconnect()
                .then(() => {
                    // won't have been set to null
                    should(db.client).eql(undefined);
                })
        });
    });
});