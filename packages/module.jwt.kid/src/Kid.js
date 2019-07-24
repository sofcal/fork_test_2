'use strict';

const crypto = require('crypto');

class Kid {
    static Generate(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

module.exports = Kid;
