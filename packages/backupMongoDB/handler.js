'use strict';

const Promise = require('bluebird');
const mds = require('mongodump-stream');
const tar = require('tar-stream');
const stb = Promise.promisify(require('stream-to-buffer'));
const Readable = require('stream').Readable;
const zlib = require('zlib');

const ParameterStoreStaticLoader = require('internal-parameterstorestaticloader');
const serviceImpls = {
    DB: require('internal-services-db'),
    Encryption: require('internal-services-encryption'),
    Key: require('internal-services-key'),
    S3: require('internal-services-s3')
};

let env, region, database, bucket;

module.exports.backupMongoDB = (event, context, callback) => {
    const services = {};

    console.log('event', event);

    return Promise.resolve(undefined)
        .then(() => {
            env = event.env;
            region = event.region;
            database = event.database;

            if(!env || !region || !bucket) {
                throw new Error(`invalid parameters - env: ${env}; region: ${region}; bucket: ${bucket}`);
            }

            console.log(`starting request for - env: ${env}; region: ${region}`);
        })
        .then(() => getParams(env, region))
        .then((params) => getServices(env, region, params, services))
        .then(() => connectDB(services, database))
        .then((db) => db.listCollections().toArray())
        .then((collections) => {
            const names = collections.map((c) => c.name);
            console.log('retrieved collections', names.join(','));

            const url = services.db.connectionString;
            const timestamp = new Date().toISOString().replace(/\..+/g, '').replace(/[-:]/g, '').replace(/T/g, '-');
            const filename = database + '-' + timestamp + '.tar';
            const key = `db-backups/${filename}`;

            const pack = tar.pack();
            const gz = zlib.createGzip();

            if(!event.wet) {
                throw new Error('dry run, skipping update');
            }

            Promise.each(collections,
                (c) => {
                    console.log('packing collection', c);
                    return packCollection(url, c.name, pack)
                        .then(() => console.log('collection packed', c.name))

                })
                .then(() => {
                    console.log('all collections packed');

                    pack.finalize();
                    //pack.pipe(gz);
                });

            pack.on('finish', () => {
                console.log('finished packing');
                pack.pipe(gz);
            })

            return services.s3.upload(key, gz, 'AES256')
                .then((versionId) => {
                    console.log('finished writing stream', bucket, key, versionId);

                    const response = {
                        statusCode: 200,
                        body: JSON.stringify({
                            message: 'backup complete',
                            key,
                            input: event,
                        }),
                    };

                    callback(null, response);
                });

                // const root = '/Users/wayne.smith/Dev/shared_services/BankingCloudLSMLambda/packages/backupMongoDB/bck';//'/tmp/backup/';
                // const filename = 'temp.tar';
                // const uri = 'mongodb://localhost:27017/bank_db';//services.db.connectionString;
                // const key = `db-backups/${filename}`;
                //
                // // if(!event.wet) {
                // //     throw new Error('dry run, skipping update');
                // // }
                //
                //
                // const backupOptions = { uri, root, inMemory: true, logger: '/Users/wayne.smith/Dev/shared_services/BankingCloudLSMLambda/packages/backupMongoDB/log.log' };
                // backup(backupOptions);
                //
                // return backupAsync(backupOptions)
                //     .then((result) => {
                //         console.log('result', result);
                // })
                // return services.s3.upload(key, stream, 'AES256')
                //     .then((meh) => {
                //         console.log('done', meh)

                // const response = {
                //     statusCode: 200,
                //     body: JSON.stringify({
                //         message: 'backup complete',
                //         key,
                //         input: event,
                //     }),
                // };
                //
                // callback(null, response);
                // // });
        })
        .catch((err) => {
            console.log('adadwdaw')
            console.log(err);
            const response = {
                statusCode: 400,
                body: JSON.stringify({
                    message: err.message,
                    input: event,
                }),
            };

            callback(null, response)
        })
        .then(() => disconnectDB(services))
};

const streamToPromise = (stream) => {
    return new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
};

const packCollection = (url, name, pack) => {
    return new Promise((resolve, reject) => {
        console.log('slurping', url, name);
        const stream = mds.slurp.binary(url, name);
        //console.log('stream', stream);

        stb(stream, (err, buffer) => {
            if(err) {
                console.log('erererer');
                console.log(err);
                //reject(err);
            }
            console.log('name', name, buffer.length);
            if(!buffer.length) {
                return resolve()
            }

            const entry = pack.entry({ name: `${name}.bson`, size: buffer.length });
            const readable = new Readable();
            readable.push(buffer);
            readable.push(null);

            readable.pipe(entry)
                .on('finish', () => {
                    console.log('finishing', name);
                    resolve()
                })
                .on('error', (err) => reject(err));
        })
    })
};

const backupAsync = (options) => {
    return new Promise((resolve, reject) => {
        const callback = (err, result) => {
            if(err) {
                reject(err);
            }

            resolve(result);
        };

        options.callback = callback;
        backup(options);
    })
};

const connectDB = (services, database) => {
    return services.db.connect(database)
        .then((db) => {
            console.log('db connected');
            return db;
        })
};

const disconnectDB = Promise.method((services) => {
    if(services.db) {
        return services.db.disconnect();
    }
});

const getServices = (env, region, params, services) => {
    const username = params['defaultMongo.username'];
    const password = params['defaultMongo.password'];
    const replicaSet = params['defaultMongo.replicaSet'];
    const domain = params['domain'];

    // services.db = new serviceImpls.DB({ });
    services.db = new serviceImpls.DB({ env, region, domain, username, password, replicaSet });
    services.key = new serviceImpls.Key({region});
    services.encryption = new serviceImpls.Encryption({});
    services.s3 = new serviceImpls.S3({bucket});

    return services;
};

const getParams = (env, region) => {
    const keys = ['domain', 'defaultMongo.username','defaultMongo.password','defaultMongo.replicaSet'];
    const paramPrefix = `/${env}/`;

    const params = {};

    console.log('retrieving keys', keys, paramPrefix);

    const loader = new ParameterStoreStaticLoader({keys, paramPrefix, env: { region } });
    return loader.load(params)
        .then(() => {
            const retrieved = Object.keys(params).length;
            if(!retrieved || retrieved < keys.length) {
                throw new Error('failed to retrieved params');
            }

            console.log(`retrieved keys - requested: ${keys.length}; retrieved: ${Object.keys(params).length}`);
            return params;
        });
};
