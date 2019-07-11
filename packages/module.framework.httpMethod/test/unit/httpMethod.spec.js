const httpMethod = require('../../lib');
const should = require('should');

describe('@sage/bc-framework-httpmethod.httpMethod', function(){
    it('should export an object with expected properties', () => {
        should(httpMethod).be.an.Object().with.properties(
            'get',
            'put',
            'post',
            'patch',
            'delete',
            'head',
            'options',
            'isGet',
            'isPost',
            'isPut',
            'isPatch',
            'isDelete',
            'isHead',
            'isOptions'
        );

        should(httpMethod.get).be.a.String();
        should(httpMethod.put).be.a.String();
        should(httpMethod.post).be.a.String();
        should(httpMethod.patch).be.a.String();
        should(httpMethod.delete).be.a.String();
        should(httpMethod.head).be.a.String();
        should(httpMethod.options).be.a.String();

        should(httpMethod.isGet).be.a.Function();
        should(httpMethod.isPost).be.a.Function();
        should(httpMethod.isPut).be.a.Function();
        should(httpMethod.isPatch).be.a.Function();
        should(httpMethod.isDelete).be.a.Function();
        should(httpMethod.isHead).be.a.Function();
        should(httpMethod.isOptions).be.a.Function();
    });

    const funcs = {
        'isGet': 'get',
        'isPost': 'post',
        'isPut': 'put',
        'isPatch': 'patch',
        'isDelete': 'delete',
        'isHead': 'head',
        'isOptions': 'options',
    };
    Object.keys(funcs).forEach( func => {
        it(`${func} should return true for valid call`, () => {
            const result = httpMethod[func](funcs[func]);
            const expected = true;
    
            should(result).eql(expected, 'Should return true');
        });

        it(`${func} should return false for invalid call`, () => {
            const result = httpMethod[func]('test');
            const expected = false;
    
            should(result).eql(expected, 'Should return false');
        });
    })
});
