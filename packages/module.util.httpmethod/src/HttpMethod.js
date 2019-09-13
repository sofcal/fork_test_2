'use strict';

class HttpMethod {
    static IsGet(method) {
        return method.toLowerCase() === 'get';
    }

    static IsPost(method) {
        return method.toLowerCase() === 'post';
    }

    static IsPut(method) {
        return method.toLowerCase() === 'put';
    }

    static IsPatch(method) {
        return method.toLowerCase() === 'patch';
    }

    static IsDelete(method) {
        return method.toLowerCase() === 'delete';
    }

    static IsHead(method) {
        return method.toLowerCase() === 'head';
    }

    static IsOptions(method) {
        return method.toLowerCase() === 'options';
    }
}

HttpMethod.get = 'get';
HttpMethod.post = 'post';
HttpMethod.put = 'put';
HttpMethod.patch = 'patch';
HttpMethod.delete = 'delete';
HttpMethod.head = 'head';
HttpMethod.options = 'options';

module.exports = HttpMethod;
