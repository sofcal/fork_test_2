'use strict';

const Promise = require('bluebird');

class KeyValuePair {
    constructor(data) {
        this.key = data.key;
        this.value = data.value;
    }

    validate() {
        return validateImpl(this);
    }
}

const validateImpl = Promise.method((self) => {
    return !(!self.key || !self.value);
});

module.exports = KeyValuePair;
