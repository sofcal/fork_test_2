'use strict';

class KeyValuePair {
    constructor(data) {
        this.key = data.key;
        this.value = data.value;
    }

    validate() {
        return !(!this.key || !this.value);
    }
}

module.exports = KeyValuePair;
