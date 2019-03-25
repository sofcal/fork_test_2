'use strict';

const jose = require('node-jose');

const TOKEN_PREAMBLE = 'Bearer ';

module.exports.generateRequestToken = generateRequestToken;


function generateRequestToken(privateKey, serviceName) {
    return getSigningKey(privateKey)
        .then(function(key) {
            return createSignedRequestToken(key);
        }, function(error) {
            console.log(error);
        })
        .then(function(token) {
            return TOKEN_PREAMBLE + serviceName + '+' +token.signatures[0].protected + "." + token.payload + "." + token.signatures[0].signature;
        })
        .catch(function(error) {
            console.log("Couldn't generate token", error);
            throw error;
        });
}

function createSignedRequestToken(key) {
    var exp = new Date();
    exp.setSeconds(exp.getSeconds() + 5);
    console.log('JWT will expire at: ', exp)
    const claims = { 'exp': exp.getTime() / 1000}
    return jose.JWS.createSign({
        fields: {
            typ: 'jwt',
            format: 'compact'
        } }, key)
        .update(JSON.stringify(claims))
        .final();
}

function getSigningKey(pemFormattedKey) {
    return jose.JWK.asKey(pemFormattedKey, 'pem');
}


// Some testing code follows
// const pk = 'MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAJzIU7aLPMc6+/x186aJ6VZ/5YNFXVSx2EbMJ2f48mWJ/wJjOJitpLgIGxvUyg5fun/MAevluA6U3+iAMBUdBObulhwYaymR93X0CM9XjNzMQXAOu9haihb98duT6DtOv/f+LuDWlwy4jEh4JVeZPzcVHnpJCgTQehboG+dRNCzHAgMBAAECgYBQSEiNphj2UB7utRuSAPbKQ22sXZ2gG/2Kq0nWdOTy18oMV/CIRgqd7hCrnLfmymA+xqGJQTWRyewqK1HzzctPAB2KA0cHkSUJlL1sdVnud9zcsb4VFtZoHspzGMtggjtJocPpDFwn1xZRRRH2t+AkGJVJvS/QsTyzGcEa1ifv6QJBAPVl0N17YIeZ6QAzxmdGJWVBQHV0XJJifC010UaW8f5+D4lKwGsBltgY8+7PkD4k7Tn5xEfdjDLVUnpmB3Wj960CQQCjjmVzRZE+0DrR1SHwPDDPJ+EwnL1Dp20Bbfrp7I8rWl+K3zUwsP1awTaH+6qk2s43vbfS+tOlAna86A6QaRTDAkEA2Bn2aeTJaAC4uE3f7XhPXDCvQ//Zuaty8RlQlxo8N0HqCpxCgLkgjmLDBc3Rl3hLVF/IYwUN/oHvJQyOiyF+7QJAe/P7JvVeMoCVU1l3sx2q0BSlMbZYKeHFVwQG2SoTBwQizJiFMzWvjQxJS52LogzBpLT/j8HQjInlex1TjFZXCQJAeDHjEynt7si1NWAOyIRv/n7bQgXWyrGLto+GlhQOIHAYWV1fcayx+IZT0ZSmH7TsPtBTv5+Z2Q3w/P82jDNtPg==';

// generateRequestToken(pk).then(function(result) {
//     console.log(result);
// }).catch(function(error) {
//     console.log(error)
// });
