const createKeyPair = require('keypair');
const Promise = require('bluebird');

module.exports = {
    createKeyPair: Promise.method((keyLength) => createKeyPair(keyLength))
};