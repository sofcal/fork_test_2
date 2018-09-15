const DB = require('../../lib');
const should = require('should');

describe('internal-services-db', function(){
    let service;
    const collection = 'test_collection';
    let database;

    before(() => {
        service = DB.Create({ localhost: true, db: 'internal_services_db' });
    });

    after(() => {
        if (database) {
            return database.dropDatabase()
                .then(() => service.disconnect());
        }
    });

    it('should create a connection to the database', () => {
        return service.connect()
            .then((db) => {
                database = db;

                return db.collection(collection).insert({ value: 'test' })
                    .then(() => db.collection(collection).find({}).toArray())
                    .then((results) => {
                        should(results).be.an.Array().of.length(1);
                        should(results[0].value).eql('test');
                    })
            })
    });
});
