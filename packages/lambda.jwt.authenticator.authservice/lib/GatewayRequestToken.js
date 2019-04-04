'use strict';

const jose = require('node-jose');

const TOKEN_PREAMBLE = 'Bearer ';

class GatewayRequestToken {
    static Generate(privateKey, serviceName) {
        return jose.JWK.asKey(privateKey, 'pem')
            .then((key) => {
                return createSignedRequestToken(key);
            })
            .then((token) => {
                return `${TOKEN_PREAMBLE}${serviceName}+${token.signatures[0].protected}.${token.payload}.${token.signatures[0].signature}`;
            });
    }
}

function createSignedRequestToken(key) {
    const exp = new Date();
    exp.setSeconds(exp.getSeconds() + 5);
    const claims = { exp: Math.ceil(exp.getTime() / 1000) };

    return jose.JWS.createSign({ fields: { typ: 'jwt', format: 'compact' } }, key)
        .update(JSON.stringify(claims))
        .final();
}

module.exports = GatewayRequestToken;
