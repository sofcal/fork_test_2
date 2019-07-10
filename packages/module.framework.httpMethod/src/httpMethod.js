'use strict';

function isGet(method) {
    return method.toLowerCase() === 'get';
}

function isPost(method) {
    return method.toLowerCase() === 'post';
}

function isPut(method) {
    return method.toLowerCase() === 'put';
}

function isPatch(method) {
    return method.toLowerCase() === 'patch';
}

function isDelete(method) {
    return method.toLowerCase() === 'delete';
}

function isHead(method) {
    return method.toLowerCase() === 'head';
}

function isOptions(method) {
    return method.toLowerCase() === 'options';
}

const httpMethod = {
    get: 'get',
    post: 'post',
    put: 'put',
    patch: 'patch',
    delete: 'delete',
    head: 'head',
    options: 'options',
    isGet,
    isPost,
    isPut,
    isPatch,
    isDelete,
    isHead,
    isOptions
};

module.exports = httpMethod;
