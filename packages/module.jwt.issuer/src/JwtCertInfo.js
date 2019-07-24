'use strict';

const { Kid } = require('@sage/sfab-s2s-jwt-kid');

class JwtCertInfo {
    static Generate(privateKey, publicKey, createdAt, isPrimary) {
        const status = isPrimary ? 'primary' : 'secondary';
        const kid = Kid.Generate(privateKey);

        return { status, privateKey, publicKey, createdAt, kid };
    }
}

module.exports = JwtCertInfo;
