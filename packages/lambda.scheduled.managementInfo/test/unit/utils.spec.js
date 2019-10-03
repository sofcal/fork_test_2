const should = require('should');
const { intersection } = require('../../lib/utils');

describe('Intersection tests', () => {
    const test1 = [
        { a: 1, b: 1 },
        { a: 2, b: 2 },
    ];
    const test2 = [
        { a: 2, b: 2 },
        { a: 3, b: 3 },
    ];
    const test3 = [
        { a: 2, b: 2 },
        { a: 4, b: 4 },
    ];

    it('Should be a function', () => {
        should(intersection).be.a.Function();
    });

    it('should return empty array if called with no arguments', () => {
        should(intersection()).be.eql([]);
    });

    it('should return empty array if called with empty arrays', () => {
        should(intersection('foo', [], [], [])).be.eql([]);
    });

    it('should empty array when key not in passed arguments', () => {
        should(intersection('foo', test1, test2)).be.eql([]);
    });

    it('should return common elements when called against mutliple arrays with valid key', () => {
        should(intersection('a', test1, test2, test3)).be.eql([ test1[1] ]);
    });
});
