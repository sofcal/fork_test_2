const AWS = require('aws-sdk');
const ssm = new AWS.SSM();
const NodeCache = require('node-cache');
const Promise = require('bluebird');

module.exports.getParameters = getParameters;

const parameterCache = new NodeCache({stdTTL: 240});

function getParameters(name) {
    return getParameters(names, false);
}

function getParameters(names, clearCache) {
    if (clearCache) {
        names.forEach(function(name) {
            parameterCache.del(name);
        });
    }
    if (names.every(inCache)) {
        console.log('Sending cached parameters')
        const parameters = parameterCache.mget(names);
        return Promise.resolve(parameters);
    }

    return ssm.getParameters({Names: names, WithDecryption: true}).promise()
        .then(function(data) {
            console.log("Got", data.Parameters.length, 'parameters');
            var map = {}
            data.Parameters.forEach(function(item) {
                map[item.Name] = item.Value;
                parameterCache.set(item.Name, item.Value);
            });

            return map;
        }).catch(function(error) {
            console.log(error, error.stack);
            throw error;
        });
}

function inCache(name) {
    return parameterCache.get(name) != undefined;
}
