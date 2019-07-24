const { Handler } = require('../../lib/index');
const should = require('should');

describe('@sage/bc-default-lambda-handler.index', function(){
    // placeholder
    it('should throw if Handler instantiated directly', () => {
        should(() => new Handler({})).throwError(new Error('Handler should not be instantiated; extend Handler instead.'));
    });
});
